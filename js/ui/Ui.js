import { CONFIG } from '../config.js';
import { pressureLabel } from '../director/Director.js';
import { UPGRADE_LIST, upgradeValueText } from '../weapon.js';

export class Ui {
  constructor() {
    this.startScreen = document.querySelector('#start-screen');
    this.pauseScreen = document.querySelector('#pause-screen');
    this.upgradeScreen = document.querySelector('#upgrade-screen');
    this.upgradeCards = document.querySelector('#upgrade-cards');
    this.resultScreen = document.querySelector('#result-screen');
    this.resultKicker = document.querySelector('#result-kicker');
    this.resultTitle = document.querySelector('#result-title');
    this.resultStats = document.querySelector('#result-stats');
    this.hudRoot = document.querySelector('#hud');
    this.bootNote = document.querySelector('#boot-note');
    this.hp = document.querySelector('#hud-hp');
    this.level = document.querySelector('#hud-level');
    this.xpFill = document.querySelector('#hud-xp-fill');
    this.kills = document.querySelector('#hud-kills');
    this.time = document.querySelector('#hud-time');
    this.weaponLine = document.querySelector('#hud-weapon');
    this.bossEta = document.querySelector('#hud-boss-eta');
    this.threatFill = document.querySelector('#hud-threat');
    this.threatLabel = document.querySelector('#hud-threat-label');
    this.directorDetail = document.querySelector('#hud-director-detail');
    this.bossBar = document.querySelector('#boss-bar');
    this.bossName = document.querySelector('#boss-name');
    this.bossFill = document.querySelector('#boss-fill');
    this.banner = document.querySelector('#banner');
    this.bannerTimer = 0;
    this.hudSignature = '';
    this.bossName.textContent = CONFIG.boss.name;

    this.upgradeCards.addEventListener('click', (event) => {
      const button = event.target.closest('[data-upgrade]');
      if (!button || this.upgradeScreen.hidden) {
        return;
      }
      this.onUpgrade?.(button.dataset.upgrade);
    });
  }

  hideBootNote() {
    this.bootNote.hidden = true;
  }

  sync(state) {
    this.startScreen.hidden = state !== 'menu';
    this.pauseScreen.hidden = state !== 'paused';
    this.upgradeScreen.hidden = state !== 'upgrade';
    this.resultScreen.hidden = state !== 'result';
    this.hudRoot.hidden = state === 'menu' || state === 'result';
  }

  updateHud(stats, weapon, director) {
    const xpRatio = stats.xpToNext > 0 ? stats.xp / stats.xpToNext : 0;
    const pressurePercent = Math.round(director.pressure * 100);
    this.threatFill.style.width = `${pressurePercent}%`;

    const eta = CONFIG.boss.spawnAt - stats.time;
    const signature = [
      stats.hp,
      stats.maxHp,
      stats.level,
      stats.kills,
      Math.floor(stats.time),
      Math.round(xpRatio * 100),
      weapon.projectiles,
      weapon.fireRate,
      weapon.damage,
      pressurePercent,
    ].join('|');
    if (signature === this.hudSignature) {
      return;
    }
    this.hudSignature = signature;
    this.hp.textContent = `${stats.hp} / ${stats.maxHp}`;
    this.level.textContent = String(stats.level);
    this.kills.textContent = String(stats.kills);
    this.time.textContent = formatTime(stats.time);
    this.xpFill.style.width = `${Math.max(0, Math.min(1, xpRatio)) * 100}%`;
    this.weaponLine.textContent = `弹道 ${weapon.projectiles}  ·  射速 ${weapon.fireRate.toFixed(1)}  ·  伤害 ${weapon.damage}`;
    this.threatLabel.textContent = pressureLabel(director.pressure);
    this.directorDetail.textContent = `精英 ${Math.round(director.eliteChance() * 100)}%  ·  同屏上限 ${director.maxAlive()}`;
    if (eta > 0) {
      this.bossEta.hidden = false;
      this.bossEta.textContent = `Boss ${formatTime(eta)}`;
      this.bossEta.classList.toggle('is-soon', eta <= 10);
    } else {
      this.bossEta.hidden = true;
    }
  }

  setBoss(boss) {
    this.bossBar.hidden = !boss;
    if (!boss) {
      return;
    }
    const ratio = boss.maxHp > 0 ? Math.max(0, boss.hp / boss.maxHp) : 0;
    this.bossFill.style.width = `${ratio * 100}%`;
  }

  showBanner(text) {
    this.banner.textContent = text;
    this.banner.hidden = false;
    clearTimeout(this.bannerTimer);
    this.bannerTimer = setTimeout(() => {
      this.banner.hidden = true;
    }, 2400);
  }

  hideBanner() {
    this.banner.hidden = true;
    clearTimeout(this.bannerTimer);
  }

  showUpgrades(weapon) {
    this.upgradeCards.replaceChildren();
    for (const upgrade of UPGRADE_LIST) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'upgrade-card';
      button.dataset.upgrade = upgrade.id;
      const name = document.createElement('strong');
      name.textContent = upgrade.name;
      const description = document.createElement('span');
      description.textContent = upgrade.description;
      const current = document.createElement('em');
      current.textContent = upgradeValueText(weapon, upgrade.id);
      button.append(name, description, current);
      this.upgradeCards.append(button);
    }
  }

  showResult({ victory, time, kills, level, weapon, pressure }) {
    this.resultKicker.textContent = victory ? 'Boss 已击倒' : '血量耗尽';
    this.resultTitle.textContent = victory ? '胜利' : '失败';
    this.resultTitle.classList.toggle('is-defeat', !victory);
    this.resultStats.replaceChildren();
    const rows = [
      ['时间', formatTime(time)],
      ['击杀', String(kills)],
      ['等级', String(level)],
      ['威胁', `${Math.round(pressure * 100)}% ${pressureLabel(pressure)}`],
      ['弹道', String(weapon.projectiles)],
      ['射速', `${weapon.fireRate.toFixed(1)} / 秒`],
      ['伤害', String(weapon.damage)],
    ];
    for (const [label, value] of rows) {
      const cell = document.createElement('div');
      cell.className = 'result-stat';
      const name = document.createElement('span');
      name.textContent = label;
      const number = document.createElement('strong');
      number.textContent = value;
      cell.append(name, number);
      this.resultStats.append(cell);
    }
  }
}

function formatTime(seconds) {
  const total = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
