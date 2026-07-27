import { abilities, abilitiesByVocation, defaultAbilityPreferences, type AbilityDefinition, type AbilityPreference, type AbilityPreferences } from '../data/abilities';
import { heroes } from '../data/config';
import type { EntitySnapshot } from '../events/types';

const STORAGE_KEY = 'tactical-hunt-helper-preferences-v1';
const LEGACY_STORAGE_KEY = 'tactical-hunt-ability-preferences';

type HeroVocation = AbilityDefinition['vocation'];

type HeroCharacter = EntitySnapshot & { role: 'knight' | 'druid' | 'sorcerer' };
const heroCharacters = heroes.filter(
  (hero): hero is HeroCharacter =>
    hero.role === 'knight' || hero.role === 'druid' || hero.role === 'sorcerer',
) as HeroCharacter[];

export interface HelperHeroConfig {
  heroId: string;
  vocation: HeroVocation;
  offensiveAbilities: Record<string, AbilityPreference>;
}

export interface HelperPreferencesModel {
  version: 1;
  selectedHeroId: string;
  heroes: HelperHeroConfig[];
}

const clone = <T>(value: T): T =>
  typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));

const isAbilityPreference = (value: unknown): value is AbilityPreference =>
  typeof value === 'object' && value !== null &&
  typeof (value as any).enabled === 'boolean' &&
  typeof (value as any).priority === 'number' &&
  Number.isFinite((value as any).priority);

const getDefaultHeroConfig = (hero: HeroCharacter): HelperHeroConfig => {
  const defaults = defaultAbilityPreferences();
  const offensiveAbilities = Object.fromEntries(
    abilities
      .filter((ability) => ability.vocation === hero.role)
      .map((ability) => [
        ability.id,
        {
          enabled: defaults[ability.id]?.enabled ?? true,
          priority: defaults[ability.id]?.priority ?? 99,
        },
      ]),
  );
  return {
    heroId: hero.id,
    vocation: hero.role,
    offensiveAbilities,
  };
};

const defaultModel = (): HelperPreferencesModel => ({
  version: 1,
  selectedHeroId: heroCharacters[0].id,
  heroes: heroCharacters.map(getDefaultHeroConfig),
});

const isHeroConfig = (value: unknown): value is HelperHeroConfig => {
  if (typeof value !== 'object' || value === null) return false;
  const config = value as HelperHeroConfig;
  if (typeof config.heroId !== 'string') return false;
  if (!['knight', 'druid', 'sorcerer'].includes(config.vocation)) return false;
  if (typeof config.offensiveAbilities !== 'object' || config.offensiveAbilities === null) return false;
  return Object.values(config.offensiveAbilities).every(isAbilityPreference);
};

const isValidModel = (value: unknown): value is HelperPreferencesModel => {
  if (typeof value !== 'object' || value === null) return false;
  const model = value as HelperPreferencesModel;
  if (model.version !== 1) return false;
  if (typeof model.selectedHeroId !== 'string') return false;
  if (!Array.isArray(model.heroes) || model.heroes.length !== heroCharacters.length) return false;
  const heroIds = new Set(heroCharacters.map((hero) => hero.id));
  if (!heroIds.has(model.selectedHeroId)) return false;
  return model.heroes.every((heroConfig) => {
    if (!isHeroConfig(heroConfig)) return false;
    if (!heroIds.has(heroConfig.heroId)) return false;
    const matching = heroes.find((hero) => hero.id === heroConfig.heroId);
    if (!matching) return false;
    if (matching.role !== heroConfig.vocation) return false;
    const expectedAbilities = abilities
      .filter((ability) => ability.vocation === matching.role)
      .map((ability) => ability.id);
    return Object.keys(heroConfig.offensiveAbilities).every((abilityId) =>
      expectedAbilities.includes(abilityId),
    );
  });
};

const parseJson = <T>(raw: string | null): T | undefined => {
  if (typeof raw !== 'string') return undefined;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
};

export class HelperPreferencesService {
  private model: HelperPreferencesModel;

  constructor() {
    this.model = this.loadModel();
  }

  load(): HelperPreferencesModel {
    return clone(this.model);
  }

  save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.model));
    } catch {
      // Persistência silente em ambientes com localStorage limitado.
    }
  }

  getSelectedHeroId(): string {
    return this.model.selectedHeroId;
  }

  setSelectedHeroId(heroId: string): void {
    if (this.model.selectedHeroId === heroId) return;
    if (!this.model.heroes.some((hero) => hero.heroId === heroId)) return;
    this.model.selectedHeroId = heroId;
    this.save();
  }

  getHeroConfig(heroId: string): HelperHeroConfig {
    const config = this.model.heroes.find((hero) => hero.heroId === heroId);
    return clone(config ?? getDefaultHeroConfig(heroCharacters[0]));
  }

  updateHeroConfig(heroId: string, config: Partial<Omit<HelperHeroConfig, 'heroId' | 'vocation'>>): void {
    const index = this.model.heroes.findIndex((hero) => hero.heroId === heroId);
    if (index === -1) return;
    const current = this.model.heroes[index];
    this.model.heroes[index] = {
      ...current,
      offensiveAbilities: config.offensiveAbilities
        ? { ...current.offensiveAbilities, ...config.offensiveAbilities }
        : current.offensiveAbilities,
    };
    this.save();
  }

  getHeroPreferences(heroId: string): AbilityPreferences {
    const config = this.getHeroConfig(heroId);
    return { ...config.offensiveAbilities };
  }

  getHeroConfigByVocation(vocation: HeroVocation): HelperHeroConfig {
    const config = this.model.heroes.find((hero) => hero.vocation === vocation);
    return clone(config ?? getDefaultHeroConfig(heroCharacters[0]));
  }

  getAllHeroPreferences(): Record<string, AbilityPreferences> {
    return Object.fromEntries(
      this.model.heroes.map((hero) => [hero.heroId, { ...hero.offensiveAbilities }]),
    );
  }

  reset(): void {
    this.model = defaultModel();
    this.save();
  }

  private loadModel(): HelperPreferencesModel {
    const persisted = parseJson<unknown>(localStorage.getItem(STORAGE_KEY));
    if (isValidModel(persisted)) {
      return clone(persisted);
    }

    const legacy = parseJson<Record<string, unknown>>(localStorage.getItem(LEGACY_STORAGE_KEY));
    if (legacy && typeof legacy === 'object') {
      const migrated = this.migrateLegacy(legacy as Record<string, unknown>);
      this.model = migrated;
      this.save();
      return clone(migrated);
    }

    return defaultModel();
  }

  private migrateLegacy(oldPreferences: Record<string, unknown>): HelperPreferencesModel {
    const legacyPrefs = oldPreferences as Record<string, Partial<AbilityPreference>>;
    const model: HelperPreferencesModel = {
      version: 1,
      selectedHeroId:
        typeof oldPreferences.selectedHeroId === 'string' &&
        heroCharacters.some((hero) => hero.id === oldPreferences.selectedHeroId)
          ? (oldPreferences.selectedHeroId as string)
          : heroCharacters[0].id,
      heroes: heroCharacters.map((hero) => {
        const heroDefaults = getDefaultHeroConfig(hero);
        const offensiveAbilities: Record<string, AbilityPreference> = {};
        for (const [abilityId, defaultValue] of Object.entries(
          heroDefaults.offensiveAbilities,
        )) {
          const legacy = legacyPrefs[abilityId];
          offensiveAbilities[abilityId] = {
            enabled:
              typeof legacy?.enabled === 'boolean'
                ? legacy.enabled
                : defaultValue.enabled,
            priority:
              Number.isFinite(legacy?.priority)
                ? (legacy?.priority as number)
                : defaultValue.priority,
          };
        }
        return {
          heroId: hero.id,
          vocation: hero.role,
          offensiveAbilities,
        };
      }),
    };
    return model;
  }
}
