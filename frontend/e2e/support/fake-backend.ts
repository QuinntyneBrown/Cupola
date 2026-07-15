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
  telemetry: { hints: string[]; unit?: string } | null;
  created: string;
  modified: string;
  createdBy: string;
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
        const annotations = this.annotations.filter(
          (a) =>
            a.text.toLowerCase().includes(query) ||
            a.tags.some((tag) => tag.toLowerCase().includes(query)),
        );
        return json({ objects, annotations });
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
          return json(this.annotations.filter((a) => a.targets.includes(keyString)));
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
