import uniqid from 'uniqid';
import Vector from './Vector';
import getEl from './getEl';

const width = window.innerWidth;
const container = getEl('.army-container');

export default class Entity {
	// idle position
	x = 0;
	y = 0;

	// attack position
	attackX = 0;
	attackY = 0;

	// current position
	rx = 0;
	ry = 0;

	speed = 0;

	// distance from attack<->idle position
	movedist = 0;
	// action state (walking|attacking|idle)
	state;
	// forward facing
	forward = true;
	type = '';

	constructor(isSpartan = false, nameOrType = '') {
		this.isSpartan = isSpartan;
		this.name = isSpartan ? nameOrType : null;
		this.type = !isSpartan ? nameOrType : null;
		this.id = uniqid();
		this.el = document.createElement('div');
		if (this.name) {
			this.text = document.createElement('span');
			this.text.innerText = this.name;
			this.el.appendChild(this.text);
		}
		this.el.style.animationDelay = (0.2 - 0.4 * Math.random()).toFixed(2) + 's';
		container.appendChild(this.el);
		this.updateState('idle');
		return this;
	}

	setPos(x, y, reset = false) {
		this.x = x;
		this.y = y;
		if (reset) {
			this.rx = this.isSpartan ? width + 50 : -50;
			this.ry = y;
		}
		return this;
	}

	setBattlePos(x, y) {
		this.attackX = x;
		this.attackY = y;
		this.movedist = new Vector(
			this.attackX - this.x,
			this.attackY - this.y
		).length;
		return this;
	}

	updateState(state) {
		if (state == this.state) return;
		this.state = state;
		this.el.className = '';
		this.el.classList.add('soldier');
		if (this.isSpartan) this.el.classList.add('spartan');
		if (this.type) this.el.classList.add(this.type);
		this.el.classList.add('state-' + this.state);
	}
}
