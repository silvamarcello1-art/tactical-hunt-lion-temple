import './style.css';
import {
  abilities,
  abilitiesByVocation,
  defaultAbilityPreferences,
  type AbilityPreferences,
} from './data/abilities';
import { heroes } from './data/config';
import type { CombatEvent, HuntResult } from './events/types';
import { PixiRenderer } from './game/PixiRenderer';

const $ = <T extends HTMLElement>(selector: string) =>
  document.querySelector<T>(selector)!;

const storageKey = 'tactical-hunt-ability-preferences';
let preferences = loadPreferences();
let renderer: PixiRenderer;
let result: HuntResult;
let currentTime = 0;
let liveXp = 0;
let liveGold = 0;
let liveKills = 0;
let liveHealing = 0;
let liveDamage: Record<string, number> = {
  knight:0,
  druid:0,
  sorcerer:0,
};
let liveLoot: Record<string, number> = {};
let loopEnabled = true;
let loopTimer: number | undefined;

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

const formatNumber = (value: number) =>
  new Intl.NumberFormat('pt-BR').format(Math.round(value));

const formatTime = (ms: number) =>
  `${String(Math.floor(ms / 60000)).padStart(2, '0')}:${String(
    Math.floor(ms / 1000) % 60,
  ).padStart(2, '0')}`;

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
      return `<article class="hero-card" id="card-${hero.id}">
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
      }" title="${ability.name} • ${ability.words}">
        <img src="${ability.icon}" alt="${ability.name}">
        <em>${ability.cooldown / 1000}s</em>
      </button>`,
    )
    .join('');
}

function renderInventory() {
  const glyphs = ['◆','⬟','✦','◈','✧','⌁','⬢','◉','♜','✤','◇','✥','◌','⬡','✶'];
  $('#backpack-slots').innerHTML = Array.from(
    { length:20 },
    (_, index) => `<span class="slot">${glyphs[index] ?? ''}</span>`,
  ).join('');
}

function renderAnalyzer(hunt?: HuntResult) {
  const waiting = !renderer || renderer.player.paused;
  const status = hunt
    ? hunt.victory
      ? 'Concluída'
      : 'Derrota'
    : waiting
      ? 'Aguardando'
      : 'Em hunt';
  const totalDamage = hunt
    ? Object.values(hunt.damage).reduce((sum, value) => sum + value, 0)
    : Object.values(liveDamage).reduce((sum, value) => sum + value, 0);
  const duration = Math.max(1, hunt?.duration ?? currentTime);
  const xp = hunt?.xp ?? liveXp;
  $('#analyzer').innerHTML = `<div class="stat-grid">
    <div class="stat"><span>Sessão</span><b id="time">${formatTime(currentTime)}</b></div>
    <div class="stat"><span>Status</span><b>${status}</b></div>
    <div class="stat highlight"><span>XP/h</span><b>${formatNumber((xp * 3600000) / duration)}</b></div>
    <div class="stat"><span>XP ganho</span><b>${formatNumber(xp)}</b></div>
    <div class="stat"><span>Kills</span><b>${hunt?.kills ?? liveKills}</b></div>
    <div class="stat"><span>Loot</span><b>${formatNumber(hunt?.gold ?? liveGold)}</b></div>
    <div class="stat"><span>Cura</span><b>${formatNumber(hunt?.healing ?? liveHealing)}</b></div>
    <div class="stat highlight"><span>Dano</span><b>${formatNumber(totalDamage)}</b></div>
  </div>`;
  const damage = hunt?.damage ?? liveDamage;
  $('#damage-breakdown').innerHTML = Object.entries(damage)
    .map(([id, amount]) => `${id}: <b>${formatNumber(amount)}</b>`)
    .join('<br>');
}

async function createRenderer() {
  renderer?.destroy();
  renderer = new PixiRenderer(preferences);
  await renderer.mount($('#game'));
  result = renderer.result;
}

function labelEvent(event: CombatEvent) {
  if (event.type === 'boss_spawn') return 'O chefe entrou na arena.';
  if (event.type === 'floor_complete') return `Andar ${event.floor} concluído.`;
  if (event.type === 'critical') return `${event.sourceId}: crítico.`;
  if (event.type === 'dodge') return `${event.targetId}: esquiva.`;
  if (event.type === 'death') return `${event.targetId} foi derrotado.`;
  if (event.type === 'aggro') return 'Aldric assumiu o aggro.';
  if (event.type === 'reposition') return `${event.sourceId} reposicionou-se.`;
  if (event.type === 'monster_aoe') return `${event.data?.ability} atingiu os tiles.`;
  if (event.type === 'loot') return `${event.data?.quantity}× ${event.data?.item}`;
  return event.type;
}

function start() {
  if (!renderer) return;
  renderer.player.play();
  $('#start').setAttribute('disabled', '');
  $('#pause').removeAttribute('disabled');
  $('#pause').textContent = 'Ⅱ Pausar';
  $('#session-state').textContent = 'Combate em andamento';
  renderAnalyzer();
}

async function restart(autoStart = false) {
  window.clearTimeout(loopTimer);
  const resultDialog = $('#result') as HTMLDialogElement;
  if (resultDialog.open) resultDialog.close();
  currentTime = 0;
  liveXp = 0;
  liveGold = 0;
  liveKills = 0;
  liveHealing = 0;
  liveDamage = { knight:0, druid:0, sorcerer:0 };
  liveLoot = {};
  renderParty();
  renderActionBar();
  $('#log').innerHTML = '';
  $('#loot').textContent = 'Nenhum item ainda.';
  $('#stage-fill').style.width = '0';
  $('#stage-label').textContent = 'Preparação';
  $('#session-state').textContent = 'Pronto para iniciar';
  document.querySelectorAll('.phase').forEach((phase, index) => {
    phase.classList.toggle('active', index === 0);
    phase.classList.remove('done');
  });
  $('#start').removeAttribute('disabled');
  $('#pause').setAttribute('disabled', '');
  await createRenderer();
  renderAnalyzer();
  if (autoStart) start();
}

function renderAbilityModal() {
  $('#ability-list').innerHTML = abilities
    .map((ability) => {
      const current = preferences[ability.id];
      return `<div class="ability-row">
        <img src="${ability.icon}" alt="">
        <div><b>${ability.name}</b><small>${ability.words} • ${ability.cooldown / 1000}s</small></div>
        <label><input type="checkbox" data-enabled="${ability.id}" ${current.enabled ? 'checked' : ''}> Ativa</label>
        <label>Prioridade
          <select data-priority="${ability.id}">
            ${[1,2,3].map((priority) => `<option ${priority === current.priority ? 'selected' : ''}>${priority}</option>`).join('')}
          </select>
        </label>
      </div>`;
    })
    .join('');
}

window.addEventListener('hunt-time', (rawEvent) => {
  currentTime = (rawEvent as CustomEvent<number>).detail;
  const element = document.querySelector('#time');
  if (element) element.textContent = formatTime(currentTime);
});

window.addEventListener('hunt-floor', (rawEvent) => {
  const floor = (rawEvent as CustomEvent<number>).detail;
  $('#stage-label').textContent = floor === 4 ? 'Boss derrotado' : `Andar ${floor + 1} de 4`;
  $('#stage-fill').style.width = `${floor * 25}%`;
  document.querySelectorAll('.phase').forEach((phase, index) => {
    phase.classList.toggle('active', index === Math.min(floor, 3));
    phase.classList.toggle('done', index < floor);
  });
});

window.addEventListener('hunt-event', (rawEvent) => {
  const event = (rawEvent as CustomEvent<CombatEvent>).detail;
  if (event.type === 'damage' || event.type === 'heal') {
    const unit = renderer.units.get(event.targetId!);
    const bar = document.querySelector<HTMLElement>(`#card-${event.targetId} .hp i`);
    if (bar && unit) bar.style.width = `${(100 * unit.currentHp) / unit.maxHp}%`;
  }
  if (
    event.type === 'damage' &&
    ['knight','druid','sorcerer'].includes(event.sourceId ?? '')
  ) {
    liveDamage[event.sourceId!] += event.data?.amount ?? 0;
  }
  if (event.type === 'heal') liveHealing += event.data?.amount ?? 0;
  if (
    event.type === 'death' &&
    !['knight','druid','sorcerer'].includes(event.targetId ?? '')
  ) {
    liveKills++;
  }
  if (event.type === 'experience') liveXp += event.data?.amount ?? 0;
  if (event.type === 'loot' && event.data?.item) {
    liveLoot[event.data.item] =
      (liveLoot[event.data.item] ?? 0) + (event.data.quantity ?? 0);
    if (event.data.item === 'Gold coin') liveGold += event.data.quantity ?? 0;
  }
  if (
    ['death','critical','dodge','loot','floor_complete','boss_spawn','aggro','monster_aoe','reposition'].includes(event.type)
  ) {
    const line = document.createElement('div');
    line.className = 'log-line';
    line.textContent = labelEvent(event);
    $('#log').prepend(line);
  }
  if (event.type === 'loot') {
    $('#loot').innerHTML = Object.entries(liveLoot)
      .map(([item, quantity]) => `${quantity}× ${item}`)
      .join('<br>');
  }
  if (['damage','heal','death','experience','loot'].includes(event.type)) {
    renderAnalyzer();
  }
});

window.addEventListener('hunt-complete', (rawEvent) => {
  const hunt = (rawEvent as CustomEvent<HuntResult>).detail;
  renderAnalyzer(hunt);
  $('#stage-fill').style.width = '100%';
  $('#stage-label').textContent = hunt.victory ? 'Hunt concluída' : 'Equipe derrotada';
  $('#session-state').textContent = loopEnabled
    ? 'Próximo ciclo em 2 segundos'
    : 'Sessão encerrada';
  $('#pause').setAttribute('disabled', '');
  $('#result-content').innerHTML = `<h2>${hunt.victory ? 'Vitória no templo' : 'A expedição falhou'}</h2>
    <div class="result-list">Duração: ${formatTime(hunt.duration)}<br>
    XP total: ${formatNumber(hunt.xp)}<br>Gold: ${formatNumber(hunt.gold)}<br>
    Monstros derrotados: ${hunt.kills}<br>Cura de Lyra: ${formatNumber(hunt.healing)}<br>
    Recompensa: ${hunt.loot['Lion King fragment'] ? 'Lion King fragment' : '—'}</div>`;
  if (loopEnabled) {
    loopTimer = window.setTimeout(() => void restart(true), 2000);
  } else {
    ($('#result') as HTMLDialogElement).showModal();
  }
});

$('#start').onclick = start;
$('#pause').onclick = () => {
  if (renderer.player.paused) {
    renderer.player.play();
    $('#pause').textContent = 'Ⅱ Pausar';
    $('#session-state').textContent = 'Combate em andamento';
  } else {
    renderer.player.pause();
    $('#pause').textContent = '▶ Continuar';
    $('#session-state').textContent = 'Sessão pausada';
  }
};
$('#restart').onclick = () => void restart();
$('#repeat').onclick = () => void restart(true);
$('#close-result').onclick = () => ($('#result') as HTMLDialogElement).close();
$('#loop-toggle').onclick = () => {
  loopEnabled = !loopEnabled;
  const button = $('#loop-toggle');
  button.classList.toggle('active', loopEnabled);
  button.setAttribute('aria-pressed', String(loopEnabled));
  button.innerHTML = `↻ Loop <span>${loopEnabled ? 'ON' : 'OFF'}</span>`;
};
$('#ability-config').onclick = () => {
  renderAbilityModal();
  ($('#ability-modal') as HTMLDialogElement).showModal();
};
$('#party-config').onclick = () => {
  renderAbilityModal();
  ($('#ability-modal') as HTMLDialogElement).showModal();
};
$('#save-abilities').onclick = (event) => {
  event.preventDefault();
  for (const ability of abilities) {
    preferences[ability.id] = {
      enabled:document.querySelector<HTMLInputElement>(`[data-enabled="${ability.id}"]`)!.checked,
      priority:Number(
        document.querySelector<HTMLSelectElement>(`[data-priority="${ability.id}"]`)!.value,
      ),
    };
  }
  localStorage.setItem(storageKey, JSON.stringify(preferences));
  ($('#ability-modal') as HTMLDialogElement).close();
  void restart();
};

document.querySelectorAll<HTMLButtonElement>('[data-speed]').forEach((button) => {
  button.onclick = () => {
    document.querySelectorAll('[data-speed]').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    renderer.player.speed = Number(button.dataset.speed);
  };
});

async function initialize() {
  renderInventory();
  renderParty();
  renderActionBar();
  renderAnalyzer();
  await createRenderer();
  renderAnalyzer();
}

void initialize();
