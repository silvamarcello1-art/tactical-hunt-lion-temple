import './style.css';
import { LiveHuntState } from './app/LiveHuntState';
import { SESSION_CONFIG } from './app/sessionConfig';
import {
  abilities,
  abilitiesByVocation,
  defaultAbilityPreferences,
  type AbilityPreferences,
} from './data/abilities';
import { heroes } from './data/config';
import type { CombatEvent, HuntResult } from './events/types';
import { PixiRenderer } from './game/PixiRenderer';

type SessionPhase =
  | 'preparing'
  | 'idle'
  | 'running'
  | 'paused'
  | 'floor_transition'
  | 'boss'
  | 'completed'
  | 'defeated'
  | 'resetting'
  | 'error';

const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;

const heroIds = new Set(['knight', 'druid', 'sorcerer']);
const storageKey = 'tactical-hunt-ability-preferences';
const liveState = new LiveHuntState();
const debugEnabled =
  new URLSearchParams(window.location.search).get('debug') === '1';

let preferences = loadPreferences();
let renderer: PixiRenderer | undefined;
let selectedHeroId = 'knight';
let sessionPhase: SessionPhase = 'preparing';
let resumePhase: Extract<
  SessionPhase,
  'running' | 'floor_transition' | 'boss'
> = 'running';
let selectedSpeed: number = SESSION_CONFIG.defaultSpeed;
let loopEnabled = true;
let loopTimer: number | undefined;
let restartInProgress = false;
let completedCycles = 0;
let lastResult: HuntResult | undefined;

function loadPreferences(): AbilityPreferences {
  try {
    const saved = localStorage.getItem(storageKey);
    return saved
      ? { ...defaultAbilityPreferences(), ...JSON.parse(saved) }
      : defaultAbilityPreferences();
  } catch {
    return defaultAbilityPreferences();
  }
}

const safeNumber = (value: number) =>
  Number.isFinite(value) && value >= 0 ? value : 0;

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(Math.round(safeNumber(value)));

const formatTime = (milliseconds: number) => {
  const ms = safeNumber(milliseconds);
  return `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(
    Math.floor(ms / 1000) % 60,
  ).padStart(2, '0')}`;
};

function setSessionPhase(phase: SessionPhase, message?: string) {
  sessionPhase = phase;
  document.documentElement.dataset.sessionState = phase;
  const startButton = $('#start') as HTMLButtonElement;
  const pauseButton = $('#pause') as HTMLButtonElement;
  const restartButton = $('#restart') as HTMLButtonElement;

  const pausable =
    phase === 'running' ||
    phase === 'paused' ||
    phase === 'floor_transition' ||
    phase === 'boss';
  startButton.disabled = phase !== 'idle';
  pauseButton.disabled = !pausable;
  restartButton.disabled = phase === 'preparing' || phase === 'resetting';
  pauseButton.textContent = phase === 'paused' ? '▶ Continuar' : 'Ⅱ Pausar';

  const defaults: Record<SessionPhase, string> = {
    preparing:'Preparando arena',
    idle:'Pronto para iniciar',
    running:'Combate em andamento',
    paused:'Sessão pausada',
    floor_transition:'Transição para a próxima etapa',
    boss:'Boss em combate',
    completed:loopEnabled ? 'Próximo ciclo em 2 segundos' : 'Sessão encerrada',
    defeated:loopEnabled ? 'Nova tentativa em 2 segundos' : 'Equipe derrotada',
    resetting:'Limpando sessão anterior',
    error:'Falha ao carregar a arena',
  };
  $('#session-state').textContent = message ?? defaults[phase];
}

function renderParty() {
  $('#party').innerHTML = heroes
    .map((hero) => {
      const vocation = hero.role as 'knight' | 'druid' | 'sorcerer';
      const spells = abilitiesByVocation(vocation)
        .map(
          (ability) =>
            `<img class="${preferences[ability.id]?.enabled ? '' : 'disabled'}"
              src="${ability.icon}" title="${ability.name} — ${ability.cooldown / 1000}s" alt="">`,
        )
        .join('');
      const roleName =
        vocation === 'knight' ? 'TANK' : vocation === 'druid' ? 'SUP' : 'DPS';
      const selected = hero.id === selectedHeroId;
      return `<article class="hero-card ${selected ? 'selected' : ''}"
        id="card-${hero.id}" data-hero-id="${hero.id}" role="button"
        tabindex="0" aria-pressed="${selected}"
        aria-label="Abrir Helper de ${hero.name}">
        <div class="hero-title">
          <span class="role-badge role-${vocation}">${roleName}</span>
          <b>${hero.name}</b><small>lv 250</small>
        </div>
        <div class="bar hp"><i style="width:100%"></i></div>
        <div class="bar mp"><i style="width:100%"></i></div>
        <div class="party-spells">${spells}</div>
      </article>`;
    })
    .join('');
}

function renderActionBar() {
  $('#action-bar').innerHTML = abilities
    .map(
      (ability) => `<button class="action ${
        preferences[ability.id]?.enabled ? '' : 'disabled'
      }" data-ability="${ability.id}" title="${ability.name} • ${ability.words}">
        <img src="${ability.icon}" alt="${ability.name}">
        <em>${ability.cooldown / 1000}s</em>
      </button>`,
    )
    .join('');
}

function renderInventory() {
  $('#backpack-slots').innerHTML = Array.from(
    { length:20 },
    (_, index) =>
      `<span class="slot" data-slot="${index + 1}" aria-label="Slot ${index + 1}"></span>`,
  ).join('');
  $('#backpack-capacity').textContent = '0 / 20 slots';
}

function healthBarColor(ratio: number) {
  if (ratio <= .3) return '#df4848';
  if (ratio <= .6) return '#e2c245';
  return '#43c965';
}

function renderAnalyzer(hunt?: HuntResult) {
  const status = hunt
    ? hunt.victory
      ? 'Concluída'
      : 'Derrota'
    : sessionPhase === 'running' ||
        sessionPhase === 'floor_transition' ||
        sessionPhase === 'boss'
      ? 'Em hunt'
      : sessionPhase === 'paused'
        ? 'Pausada'
        : 'Aguardando';
  const damage = hunt?.damage ?? liveState.damage;
  const totalDamage = Object.values(damage).reduce(
    (sum, value) => sum + safeNumber(value),
    0,
  );
  const duration = Math.max(1, hunt?.duration ?? liveState.time);
  const xp = hunt?.xp ?? liveState.xp;
  const damageTaken = hunt?.damageTaken ?? liveState.damageTaken;
  const bosses = hunt ? (hunt.victory ? 1 : 0) : liveState.bosses;
  $('#analyzer').innerHTML = `<div class="stat-grid">
    <div class="stat"><span>Sessão</span><b id="time">${formatTime(liveState.time)}</b></div>
    <div class="stat"><span>Status</span><b>${status}</b></div>
    <div class="stat highlight"><span>XP/h</span><b>${formatNumber((xp * 3600000) / duration)}</b></div>
    <div class="stat"><span>XP ganho</span><b>${formatNumber(xp)}</b></div>
    <div class="stat"><span>Kills</span><b>${hunt?.kills ?? liveState.kills}</b></div>
    <div class="stat"><span>Bosses</span><b>${bosses}</b></div>
    <div class="stat"><span>Loot</span><b>${formatNumber(hunt?.gold ?? liveState.gold)}</b></div>
    <div class="stat"><span>Cura</span><b>${formatNumber(hunt?.healing ?? liveState.healing)}</b></div>
    <div class="stat"><span>Dano recebido</span><b>${formatNumber(damageTaken)}</b></div>
    <div class="stat highlight"><span>Dano</span><b>${formatNumber(totalDamage)}</b></div>
  </div>`;
  $('#damage-breakdown').innerHTML = Object.entries(damage)
    .map(([id, amount]) => `${id}: <b>${formatNumber(amount)}</b>`)
    .join('<br>');
}

function resetInterface() {
  liveState.reset();
  lastResult = undefined;
  document.documentElement.dataset.processedEvents = '0';
  document.documentElement.dataset.bossSpawns = '0';
  renderParty();
  renderActionBar();
  $('#log').replaceChildren();
  $('#loot').textContent = 'Nenhum item ainda.';
  $('#loot-capacity').textContent = '0 / 64 slots';
  $('#stage-fill').style.width = '0';
  $('#stage-label').textContent = 'Preparação';
  document.querySelectorAll('.phase').forEach((phase, index) => {
    phase.classList.toggle('active', index === 0);
    phase.classList.remove('done');
  });
}

async function createRenderer() {
  renderer?.destroy();
  renderer = undefined;
  const nextRenderer = new PixiRenderer(preferences, {
    debugEnabled,
    selectedHeroId,
  });
  try {
    await nextRenderer.mount($('#game'));
    nextRenderer.player.speed = selectedSpeed;
    renderer = nextRenderer;
  } catch (error) {
    nextRenderer.destroy();
    throw error;
  }
}

function labelEvent(event: CombatEvent) {
  if (event.type === 'boss_spawn') return 'O chefe entrou na arena.';
  if (event.type === 'floor_complete') return `Andar ${event.floor} concluído.`;
  if (event.type === 'critical') return `${event.sourceId}: crítico.`;
  if (event.type === 'dodge') return `${event.targetId}: esquiva.`;
  if (event.type === 'death') return `${event.targetId} foi derrotado.`;
  if (event.type === 'aggro') {
    return 'Aldric puxou os inimigos com exeta amp res.';
  }
  if (event.type === 'reposition') {
    return `${event.sourceId} reposicionou-se.`;
  }
  if (event.type === 'monster_aoe') {
    return `${event.data?.ability} atingiu os tiles.`;
  }
  if (event.type === 'loot') {
    return `${event.data?.quantity}× ${event.data?.item}`;
  }
  return event.type;
}

function start() {
  if (sessionPhase !== 'idle' || !renderer?.player.play()) return;
  setSessionPhase('running');
  renderAnalyzer();
}

function clearLoopTimer() {
  window.clearTimeout(loopTimer);
  loopTimer = undefined;
}

function showFatalError(error: unknown) {
  console.error('Falha controlada ao carregar a arena:', error);
  renderer?.destroy();
  renderer = undefined;
  $('#game').innerHTML = `<div class="game-fallback" role="alert">
    <b>Não foi possível carregar a arena.</b>
    <small>Use “Reiniciar” para tentar novamente.</small>
  </div>`;
  setSessionPhase('error');
  renderAnalyzer();
}

async function restart(autoStart = false) {
  if (restartInProgress) return;
  restartInProgress = true;
  clearLoopTimer();
  const resultDialog = $('#result') as HTMLDialogElement;
  if (resultDialog.open) resultDialog.close();
  setSessionPhase('resetting');
  resetInterface();
  setSessionPhase('preparing');
  try {
    await createRenderer();
    setSessionPhase('idle');
    renderAnalyzer();
    restartInProgress = false;
    if (autoStart) start();
  } catch (error) {
    restartInProgress = false;
    showFatalError(error);
  }
}

function vocationLabel(role: string) {
  if (role === 'knight') return 'Knight • frontline';
  if (role === 'druid') return 'Druid • suporte';
  return 'Sorcerer • dano à distância';
}

function selectHero(heroId: string, openHelper = false) {
  if (!heroIds.has(heroId)) return;
  selectedHeroId = heroId;
  document.documentElement.dataset.selectedHero = heroId;
  renderer?.selectHero(heroId);
  document.querySelectorAll<HTMLElement>('[data-hero-id]').forEach((card) => {
    const selected = card.dataset.heroId === heroId;
    card.classList.toggle('selected', selected);
    card.setAttribute('aria-pressed', String(selected));
  });
  if (openHelper) showAbilityModal(heroId);
}

function renderAbilityModal(heroId = selectedHeroId) {
  const hero = heroes.find((candidate) => candidate.id === heroId) ?? heroes[0];
  const vocation = hero.role as 'knight' | 'druid' | 'sorcerer';
  $('#helper-character-name').textContent = hero.name;
  $('#helper-character-vocation').textContent = vocationLabel(vocation);
  $('#ability-list').innerHTML = abilitiesByVocation(vocation, preferences)
    .map((ability) => {
      const current = preferences[ability.id];
      return `<div class="ability-row">
        <img src="${ability.icon}" alt="">
        <div><b>${ability.name}</b><small>${ability.words} • ${ability.cooldown / 1000}s</small></div>
        <label><input type="checkbox" data-enabled="${ability.id}" ${current.enabled ? 'checked' : ''}> Ativa</label>
        <label>Prioridade
          <select data-priority="${ability.id}">
            ${[1,2,3]
              .map(
                (priority) =>
                  `<option ${priority === current.priority ? 'selected' : ''}>${priority}</option>`,
              )
              .join('')}
          </select>
        </label>
      </div>`;
    })
    .join('');
}

function showAbilityModal(heroId = selectedHeroId) {
  selectHero(heroId);
  renderAbilityModal(heroId);
  const dialog = $('#ability-modal') as HTMLDialogElement;
  if (!dialog.open) dialog.showModal();
}

function showFutureModule(title: string, description: string) {
  $('#future-title').textContent = title;
  $('#future-description').textContent =
    `Disponível em um próximo MVP. ${description}`;
  const dialog = $('#future-modal') as HTMLDialogElement;
  if (!dialog.open) dialog.showModal();
}

function showResult(hunt: HuntResult) {
  $('#result-content').innerHTML = `<h2>${hunt.victory ? 'Vitória no templo' : 'A expedição falhou'}</h2>
    <div class="result-list">Duração: ${formatTime(hunt.duration)}<br>
    XP total: ${formatNumber(hunt.xp)}<br>Gold: ${formatNumber(hunt.gold)}<br>
    Monstros derrotados: ${hunt.kills}<br>Cura de Lyra: ${formatNumber(hunt.healing)}<br>
    Recompensa: ${hunt.loot['Lion King fragment'] ? 'Lion King fragment' : '—'}</div>`;
  const dialog = $('#result') as HTMLDialogElement;
  if (!dialog.open) dialog.showModal();
}

function scheduleLoop() {
  clearLoopTimer();
  if (
    !loopEnabled ||
    (sessionPhase !== 'completed' && sessionPhase !== 'defeated')
  ) {
    return;
  }
  loopTimer = window.setTimeout(
    () => void restart(true),
    SESSION_CONFIG.loopDelayMs,
  );
}

window.addEventListener('hunt-time', (rawEvent) => {
  liveState.setTime((rawEvent as CustomEvent<number>).detail);
  const element = document.querySelector('#time');
  if (element) element.textContent = formatTime(liveState.time);
});

window.addEventListener('hunt-floor', (rawEvent) => {
  const floor = (rawEvent as CustomEvent<number>).detail;
  $('#stage-label').textContent =
    floor === 4 ? 'Boss derrotado' : `Andar ${floor + 1} de 4`;
  $('#stage-fill').style.width = `${floor * 25}%`;
  document.querySelectorAll('.phase').forEach((phase, index) => {
    phase.classList.toggle('active', index === Math.min(floor, 3));
    phase.classList.toggle('done', index < floor);
  });
  if (floor < 4 && sessionPhase !== 'paused') {
    setSessionPhase('floor_transition');
  }
});

window.addEventListener('hunt-event', (rawEvent) => {
  const event = (rawEvent as CustomEvent<CombatEvent>).detail;
  liveState.apply(event);
  const processedEvents =
    Number(document.documentElement.dataset.processedEvents ?? 0) + 1;
  document.documentElement.dataset.processedEvents = String(processedEvents);

  if (
    event.type === 'spawn' &&
    sessionPhase === 'floor_transition' &&
    event.floor < 4
  ) {
    setSessionPhase('running');
  }
  if (event.type === 'boss_spawn' && sessionPhase !== 'paused') {
    const bossSpawns =
      Number(document.documentElement.dataset.bossSpawns ?? 0) + 1;
    document.documentElement.dataset.bossSpawns = String(bossSpawns);
    setSessionPhase('boss');
  }

  if (event.type === 'spawn' && heroIds.has(event.targetId ?? '')) {
    const hp = document.querySelector<HTMLElement>(
      `#card-${event.targetId} .hp i`,
    );
    const mp = document.querySelector<HTMLElement>(
      `#card-${event.targetId} .mp i`,
    );
    if (hp) {
      hp.style.width = '100%';
      hp.style.background = healthBarColor(1);
    }
    if (mp) mp.style.width = '100%';
  }

  if (event.type === 'damage' || event.type === 'heal') {
    const unit = renderer?.units.get(event.targetId!);
    const bar = document.querySelector<HTMLElement>(
      `#card-${event.targetId} .hp i`,
    );
    if (bar && unit) {
      const ratio = unit.maxHp > 0 ? unit.currentHp / unit.maxHp : 0;
      bar.style.width = `${100 * ratio}%`;
      bar.style.background = healthBarColor(ratio);
    }
  }

  if (event.type === 'cast' && heroIds.has(event.sourceId ?? '')) {
    const unit = renderer?.units.get(event.sourceId!);
    const bar = document.querySelector<HTMLElement>(
      `#card-${event.sourceId} .mp i`,
    );
    if (bar && unit) {
      const ratio = unit.maxMana > 0 ? unit.currentMana / unit.maxMana : 0;
      bar.style.width = `${100 * ratio}%`;
    }
  }

  if (
    [
      'death',
      'critical',
      'dodge',
      'loot',
      'floor_complete',
      'boss_spawn',
      'aggro',
      'monster_aoe',
      'reposition',
    ].includes(event.type)
  ) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = labelEvent(event);
    $('#log').prepend(line);
  }

  if (event.type === 'loot') {
    $('#loot').innerHTML = Object.entries(liveState.loot)
      .map(([item, quantity]) => `${quantity}× ${item}`)
      .join('<br>');
    $('#loot-capacity').textContent =
      `${liveState.occupiedLootSlots} / 64 slots`;
  }

  if (['damage','heal','death','experience','loot'].includes(event.type)) {
    renderAnalyzer();
  }
});

window.addEventListener('hunt-complete', (rawEvent) => {
  const hunt = (rawEvent as CustomEvent<HuntResult>).detail;
  lastResult = hunt;
  completedCycles++;
  document.documentElement.dataset.completedCycles = String(completedCycles);
  renderAnalyzer(hunt);
  $('#stage-fill').style.width = '100%';
  $('#stage-label').textContent = hunt.victory
    ? 'Hunt concluída'
    : 'Equipe derrotada';
  setSessionPhase(hunt.victory ? 'completed' : 'defeated');
  if (loopEnabled) scheduleLoop();
  else showResult(hunt);
});

$('#start').onclick = start;
$('#pause').onclick = () => {
  if (!renderer) return;
  if (sessionPhase === 'paused') {
    if (renderer.player.play()) setSessionPhase(resumePhase);
  } else if (
    (sessionPhase === 'running' ||
      sessionPhase === 'floor_transition' ||
      sessionPhase === 'boss') &&
    renderer.player.pause()
  ) {
    resumePhase = sessionPhase;
    setSessionPhase('paused');
  }
  renderAnalyzer();
};
$('#restart').onclick = () => void restart();
$('#repeat').onclick = () => void restart(true);
$('#close-result').onclick = () => {
  ($('#result') as HTMLDialogElement).close();
};
$('#loop-toggle').onclick = () => {
  loopEnabled = !loopEnabled;
  const button = $('#loop-toggle');
  button.classList.toggle('active', loopEnabled);
  button.setAttribute('aria-pressed', String(loopEnabled));
  button.innerHTML = `↻ Loop <span>${loopEnabled ? 'ON' : 'OFF'}</span>`;
  if (!loopEnabled) {
    clearLoopTimer();
    if (
      (sessionPhase === 'completed' || sessionPhase === 'defeated') &&
      lastResult
    ) {
      setSessionPhase(sessionPhase);
      showResult(lastResult);
    }
  } else if (sessionPhase === 'completed' || sessionPhase === 'defeated') {
    setSessionPhase(sessionPhase);
    const resultDialog = $('#result') as HTMLDialogElement;
    if (resultDialog.open) resultDialog.close();
    scheduleLoop();
  }
};

$('#ability-config').onclick = () => showAbilityModal();
$('#party-config').onclick = () => showAbilityModal();
$('#party').onclick = (event) => {
  const card = (event.target as Element).closest<HTMLElement>('[data-hero-id]');
  if (card?.dataset.heroId) selectHero(card.dataset.heroId, true);
};
$('#party').onkeydown = (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') return;
  const card = (event.target as Element).closest<HTMLElement>('[data-hero-id]');
  if (!card?.dataset.heroId) return;
  event.preventDefault();
  selectHero(card.dataset.heroId, true);
};
$('#action-bar').onclick = (event) => {
  const button = (event.target as Element).closest<HTMLButtonElement>(
    '[data-ability]',
  );
  if (!button) return;
  const ability = abilities.find(
    (candidate) => candidate.id === button.dataset.ability,
  );
  const hero = heroes.find((candidate) => candidate.role === ability?.vocation);
  showAbilityModal(hero?.id ?? selectedHeroId);
};
$('#save-abilities').onclick = (event) => {
  event.preventDefault();
  for (const ability of abilities) {
    const enabled = document.querySelector<HTMLInputElement>(
      `[data-enabled="${ability.id}"]`,
    );
    const priority = document.querySelector<HTMLSelectElement>(
      `[data-priority="${ability.id}"]`,
    );
    if (!enabled || !priority) continue;
    preferences[ability.id] = {
      enabled:enabled.checked,
      priority:Number(priority.value),
    };
  }
  localStorage.setItem(storageKey, JSON.stringify(preferences));
  ($('#ability-modal') as HTMLDialogElement).close();
  void restart();
};

const futureModules: Record<string, [string, string]> = {
  bestiary:[
    'Bestiário — próximo MVP',
    'A progressão por criaturas será implementada no MVP de progressões, após a fidelidade visual e mecânica da hunt.',
  ],
  progression:[
    'Progressão — próximo MVP',
    'Skills, proficiências, charms e preys permanecem fora do MVP 0.',
  ],
  storage:[
    'Armazém — próximo MVP',
    'Gestão persistente de itens depende do MVP de inventário e backend.',
  ],
  social:[
    'Social — próximo MVP',
    'Guild, ranking e comunicação serão tratados somente no MVP social.',
  ],
};

document.querySelectorAll<HTMLButtonElement>('[data-module]').forEach((button) => {
  button.onclick = () => {
    if (button.dataset.module === 'helper') {
      showAbilityModal();
      return;
    }
    const module = futureModules[button.dataset.module ?? ''];
    if (module) showFutureModule(...module);
  };
});

window.addEventListener('hunt-select-character', (rawEvent) => {
  const heroId = (rawEvent as CustomEvent<string>).detail;
  selectHero(heroId, true);
});

document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach((item) => {
      const active = item === button;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });
    const view = button.dataset.view;
    const summary = $('#view-summary');
    if (view === 'general') {
      summary.hidden = true;
      summary.textContent = '';
    } else {
      summary.hidden = false;
      summary.textContent =
        view === 'combat'
          ? 'A análise detalhada de dano e ameaças será ampliada no MVP 1.'
          : 'A gestão de loot e filtros pertence ao MVP de inventário.';
    }
  };
});

document.querySelectorAll<HTMLButtonElement>('[data-collapse]').forEach((button) => {
  button.onclick = () => {
    const content = button
      .closest('.panel')
      ?.querySelector<HTMLElement>('.collapsible-content');
    if (!content) return;
    content.hidden = !content.hidden;
    button.setAttribute('aria-expanded', String(!content.hidden));
    button.textContent = content.hidden ? '+' : '−';
  };
});

$('#supply-config').onclick = () => {
  showFutureModule(
    'Supply Pouch — próximo MVP',
    'Configuração e consumo persistente de supplies serão implementados no MVP de inventário.',
  );
};
$('#close-future').onclick = () => {
  ($('#future-modal') as HTMLDialogElement).close();
};

document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((button) => {
  button.onclick = () => {
    const value = Number(button.dataset.speed);
    if (!SESSION_CONFIG.allowedSpeeds.includes(value as 1 | 2 | 4)) return;
    selectedSpeed = value;
    document.documentElement.dataset.playbackSpeed = String(value);
    document.querySelectorAll('[data-speed]').forEach((item) => {
      item.classList.toggle('active', item === button);
    });
    if (renderer) renderer.player.speed = selectedSpeed;
  };
});

window.addEventListener('beforeunload', () => {
  clearLoopTimer();
  renderer?.destroy();
});

async function initialize() {
  document.documentElement.dataset.completedCycles = '0';
  document.documentElement.dataset.playbackSpeed = String(selectedSpeed);
  document.documentElement.dataset.processedEvents = '0';
  document.documentElement.dataset.bossSpawns = '0';
  document.documentElement.dataset.selectedHero = selectedHeroId;
  document.documentElement.dataset.debugEnabled = String(debugEnabled);
  renderInventory();
  resetInterface();
  setSessionPhase('preparing');
  renderAnalyzer();
  try {
    await createRenderer();
    setSessionPhase('idle');
    renderAnalyzer();
  } catch (error) {
    showFatalError(error);
  }
}

void initialize();
