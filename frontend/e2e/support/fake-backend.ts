import { Page } from '@playwright/test';

import annotationsFixture from '../fixtures/annotations.json';
import brandingFixture from '../fixtures/branding.json';
import buildInfoFixture from '../fixtures/build-info.json';
import objectsFixture from '../fixtures/objects.json';

export interface DomainObjectFixture {
  identifier: { namespace: string; key: string };
  keyString: string;
  name: string;
  type: string;
  location: string | null;
  composition: string[];
  telemetry: { hints: string[]; unit?: string; filters?: unknown[] } | null;
  created: string;
  modified: string;
  createdBy: string;
  version?: number;
  /** Type-specific view/behavior configuration (B01, wave-4 extension). */
  configuration?: Record<string, unknown>;
}

export interface AnnotationFixture {
  keyString: string;
  text: string;
  targets: string[];
  tags: string[];
  modified: string;
}

/**
 * In-memory copy of the canonical seed served through Playwright route
 * interception. Mirrors the backend REST contract exactly; mutations (PUT)
 * only affect the copy owned by the current test.
 */
export class FakeBackend {
  readonly objects = new Map<string, DomainObjectFixture>();
  readonly annotations: AnnotationFixture[];

  constructor() {
    for (const object of objectsFixture as DomainObjectFixture[]) {
      this.objects.set(object.keyString, structuredClone(object));
    }
    this.annotations = structuredClone(annotationsFixture) as AnnotationFixture[];
  }

  object(keyString: string): DomainObjectFixture {
    const object = this.objects.get(keyString);
    if (!object) {
      throw new Error(`Unknown fixture object: ${keyString}`);
    }
    return object;
  }

  /** Upserts a domain object, returning a B04 ObjectSaveResult-shaped payload. */
  save(object: DomainObjectFixture): {
    keyString: string;
    outcome: string;
    object: DomainObjectFixture;
  } {
    const outcome = this.objects.has(object.keyString) ? 'updated' : 'created';
    this.objects.set(object.keyString, structuredClone(object));
    return { keyString: object.keyString, outcome, object };
  }

  /**
   * Fixture annotations plus annotation-typed objects saved through the generic
   * persistence routes, projected onto the B10 shape (mirrors the backend store).
   */
  allAnnotations(): AnnotationFixture[] {
    const projected: AnnotationFixture[] = [];
    for (const object of this.objects.values()) {
      if (object.type !== 'annotation') {
        continue;
      }
      const payload = object.configuration?.['annotation'] as
        { text?: string; targets?: string[]; tags?: string[] } | undefined;
      if (!payload) {
        continue;
      }
      projected.push({
        keyString: object.keyString,
        text: payload.text ?? '',
        targets: payload.targets ?? [],
        tags: payload.tags ?? [],
        modified: object.modified,
      });
    }
    return [...this.annotations, ...projected];
  }

  /** Deterministic sine history: one point per second, capped at 200 points. */
  private static sineHistory(
    keyString: string,
    start: number,
    end: number,
  ): { keyString: string; timestamp: string; value: number }[] {
    const span = Math.max(end - start, 0);
    const step = Math.max(1000, Math.ceil(span / 200 / 1000) * 1000);
    const values: { keyString: string; timestamp: string; value: number }[] = [];
    for (let t = start; t <= end; t += step) {
      const phase = (t % 60_000) / 60_000;
      const value = Math.round((Math.sin(2 * Math.PI * phase) * 50 + 50) * 1000) / 1000;
      values.push({ keyString, timestamp: new Date(t).toISOString(), value });
    }
    return values;
  }

  async install(page: Page): Promise<void> {
    await page.route('**/api/**', (route) => {
      const request = route.request();
      const url = new URL(request.url());
      const path = url.pathname;
      const json = (body: unknown, status = 200) =>
        route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

      if (path === '/api/branding/build-info') {
        return json(buildInfoFixture);
      }
      if (path === '/api/branding') {
        return json(brandingFixture);
      }
      if (path === '/api/search') {
        const query = (url.searchParams.get('q') ?? '').trim().toLowerCase();
        if (!query) {
          return json({ objects: [], annotations: [] });
        }
        const objects = [...this.objects.values()].filter((o) =>
          o.name.toLowerCase().includes(query),
        );
        const annotations = this.allAnnotations().filter(
          (a) =>
            a.text.toLowerCase().includes(query) ||
            a.tags.some((tag) => tag.toLowerCase().includes(query)),
        );
        return json({ objects, annotations });
      }

      // Historical telemetry: deterministic sine so plots/tables load repeatably.
      const telemetryPath = path.match(/^\/api\/telemetry\/([^/]+)$/);
      if (telemetryPath) {
        const keyString = decodeURIComponent(telemetryPath[1]);
        if (!this.objects.get(keyString)?.telemetry) {
          return json({ title: 'Not Found', status: 404 }, 404);
        }
        const start = Number(url.searchParams.get('start') ?? 0);
        const end = Number(url.searchParams.get('end') ?? 0);
        return json(FakeBackend.sineHistory(keyString, start, end));
      }

      // B04 persistence routes (the app binds CouchObjectsGateway, which batches
      // same-tick gets to /batch-get and saves through /objects and /batch).
      if (path === '/api/objects/batch-get' && request.method() === 'POST') {
        const body = request.postDataJSON() as { keyStrings?: string[] };
        const objects = (body?.keyStrings ?? [])
          .map((key) => this.objects.get(key))
          .filter((object): object is DomainObjectFixture => object !== undefined);
        return json(objects);
      }
      if (path === '/api/objects/batch' && request.method() === 'POST') {
        const body = request.postDataJSON() as DomainObjectFixture[];
        return json(body.map((object) => this.save(object)));
      }
      if (path === '/api/objects' && request.method() === 'POST') {
        return json(this.save(request.postDataJSON() as DomainObjectFixture));
      }

      const objectPath = path.match(/^\/api\/objects\/([^/]+)(?:\/(composition|annotations))?$/);
      if (objectPath) {
        const keyString = decodeURIComponent(objectPath[1]);
        const object = this.objects.get(keyString);
        if (!object) {
          return json({ title: 'Not Found', status: 404 }, 404);
        }
        if (objectPath[2] === 'composition') {
          return json(object.composition.map((child) => this.object(child)));
        }
        if (objectPath[2] === 'annotations') {
          return json(this.allAnnotations().filter((a) => a.targets.includes(keyString)));
        }
        if (request.method() === 'PUT') {
          const body = request.postDataJSON() as { name?: string };
          if (!body?.name?.trim()) {
            return json({ title: 'Bad Request', status: 400 }, 400);
          }
          object.name = body.name;
          object.modified = new Date().toISOString();
          return json(object);
        }
        return json(object);
      }

      return json({ title: 'Not Found', status: 404 }, 404);
    });
  }
}
