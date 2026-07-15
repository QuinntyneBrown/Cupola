import { DomainObject } from '../models/domain-object';
import { Identifier } from '../models/identifier';
import { makeKeyString, parseKeyString } from '../models/key-string';
import { ObjectMigrationService } from './object-migration.service';

export interface StaticTreeData {
  rootId: string;
  openmct: Record<string, unknown>;
}

export interface StaticRootRegistry {
  addProvider(namespace: string, provider: StaticModelProvider): void;
  addRoot(identifier: Identifier): void;
}

export interface StaticRootConfig {
  resourceUrl: string;
  rootIdentifier: Identifier;
}

/** Immutable provider for a remapped static import tree. */
export class StaticModelProvider {
  private readonly objects = new Map<string, DomainObject>();

  constructor(
    data: StaticTreeData,
    readonly rootIdentifier: Identifier,
    migrations = new ObjectMigrationService(),
  ) {
    const originalIds = Object.keys(data.openmct);
    const idMap = new Map<string, string>();
    let nextChildKey = 0;
    originalIds.forEach((id) => {
      if (id === data.rootId) {
        idMap.set(id, rootIdentifier.key);
        return;
      }
      while (String(nextChildKey) === rootIdentifier.key) {
        nextChildKey += 1;
      }
      idMap.set(id, String(nextChildKey));
      nextChildKey += 1;
    });
    const oldRootNamespace = parseKeyString(data.rootId).namespace;

    originalIds.forEach((originalId) => {
      const key = idMap.get(originalId) as string;
      const remapped = remapValue(
        data.openmct[originalId],
        idMap,
        rootIdentifier.namespace,
        oldRootNamespace,
      ) as Record<string, unknown>;
      remapped['identifier'] = { namespace: rootIdentifier.namespace, key };
      remapped['keyString'] = makeKeyString({ namespace: rootIdentifier.namespace, key });
      if (originalId === data.rootId) {
        remapped['location'] = 'ROOT';
      }
      const object = migrations.migrate(remapped);
      this.objects.set(object.keyString, object);
    });
  }

  get(identifier: Identifier | string): DomainObject {
    const keyString = typeof identifier === 'string' ? identifier : makeKeyString(identifier);
    const object = this.objects.get(keyString);
    if (!object) {
      throw new Error(`Static object '${keyString}' was not found.`);
    }
    return object;
  }

  getComposition(identifier: Identifier | string): DomainObject[] {
    return this.get(identifier).composition.map((child) => this.get(child));
  }
}

/** Loads a static resource and registers its provider and root. */
export class StaticRootPlugin {
  constructor(
    private readonly registry: StaticRootRegistry,
    private readonly loadResource: (url: string) => Promise<StaticTreeData> = async (url) => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Static root request failed with HTTP ${response.status}.`);
      }
      return (await response.json()) as StaticTreeData;
    },
  ) {}

  async initialize(config: StaticRootConfig): Promise<StaticModelProvider> {
    const provider = new StaticModelProvider(
      await this.loadResource(config.resourceUrl),
      config.rootIdentifier,
    );
    this.registry.addProvider(config.rootIdentifier.namespace, provider);
    this.registry.addRoot(config.rootIdentifier);
    return provider;
  }
}

function remapValue(
  value: unknown,
  idMap: Map<string, string>,
  newNamespace: string,
  oldNamespace: string,
  property?: string,
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => remapValue(item, idMap, newNamespace, oldNamespace));
  }
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, child]) => {
        const mappedKey = idMap.has(key)
          ? makeKeyString({ namespace: newNamespace, key: idMap.get(key) as string })
          : key;
        return [mappedKey, remapValue(child, idMap, newNamespace, oldNamespace, key)];
      }),
    );
  }
  if (typeof value !== 'string') {
    return value;
  }
  if (property === 'namespace') {
    return value === oldNamespace ? newNamespace : value;
  }
  const mapped =
    idMap.get(value) ??
    idMap.get(oldNamespace ? makeKeyString({ namespace: oldNamespace, key: value }) : value);
  if (mapped !== undefined) {
    return property === 'key' ? mapped : makeKeyString({ namespace: newNamespace, key: mapped });
  }
  return value;
}
