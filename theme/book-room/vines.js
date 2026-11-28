(() => {
  const toolbar = document.querySelector('.folio-toolbar');
  if (!toolbar || !window.LSystem) return;
  const garden = document.createElement('div');
  garden.className = 'folio-vines';
  toolbar.querySelector('.header-left').after(garden);

  function makePart(parent, className, x, y, angle = 0) {
    const part = document.createElement('span');
    part.className = className;
    part.style.setProperty('--x', `${x.toFixed(1)}px`);
    part.style.setProperty('--y', `${y.toFixed(1)}px`);
    part.style.setProperty('--angle', `${angle.toFixed(1)}deg`);
    parent.append(part);
    return part;
  }

  function blossom(strand, x, y, pale) {
    const flower = document.createElement('button');
    flower.type = 'button';
    flower.className = 'folio-blossom';
    flower.style.setProperty('--x', `${x}px`);
    flower.style.setProperty('--y', `${y}px`);
    flower.toggleAttribute('data-pale', pale);
    flower.setAttribute('aria-label', pale ? '拨动白花' : '拨动粉花');
    flower.setAttribute('aria-pressed', 'false');
    for (let petal = 0; petal < 5; petal++) {
      const layer = document.createElement('span');
      layer.style.setProperty('--petal', `${petal * 72}deg`);
      flower.append(layer);
    }
    flower.addEventListener('click', () => {
      flower.setAttribute('aria-pressed', String(flower.getAttribute('aria-pressed') === 'false'));
    });
    strand.append(flower);
  }

  function grow(axiom, origin, stride, pale) {
    const strand = document.createElement('div');
    strand.className = 'folio-strand';
    if (pale) strand.classList.add('folio-strand-light');
    garden.append(strand);

    const structure = document.createElement('span');
    structure.className = 'folio-stems';
    structure.setAttribute('aria-hidden', 'true');
    strand.append(structure);
    const grammar = new window.LSystem({
      axiom,
      productions: { S: 'F[+FL][-FL]', T: 'F[-FB][+FL]', G: 'F[+FL]' }
    }).iterate(1);
    const stack = [];
    let tip = { ...origin };
    let mark = 0;
    for (const symbol of grammar) {
      switch (symbol) {
        case '[': stack.push({ ...tip }); break;
        case ']': tip = stack.pop(); break;
        case '+': tip.angle += 52; break;
        case '-': tip.angle -= 59; break;
        case 'F': {
          const angle = tip.angle + Math.sin(tip.x / 25) * 15;
          const radians = angle * Math.PI / 180;
          const length = stack.length ? stride * .64 : stride;
          const piece = makePart(structure, 'folio-stem', tip.x, tip.y, angle);
          piece.style.width = `${length + 1.2}px`;
          tip.x += Math.cos(radians) * length;
          tip.y += Math.sin(radians) * length;
          break;
        }
        case 'L': {
          const leaf = makePart(structure, 'folio-ivy-leaf', tip.x, tip.y, tip.angle);
          leaf.style.setProperty('--twist', `${[-32, 27, 43, -17][mark % 4]}deg`);
          leaf.style.setProperty('--leaf-size', `${10 + (mark++ % 4) * 2}px`);
          break;
        }
        case 'B': blossom(strand, tip.x, tip.y, pale); break;
      }
    }
  }

  grow('GSGSTSSGSS', { x: 6, y: 37, angle: -8 }, 17, false);
  grow('GSTSGSSS', { x: 317, y: 42, angle: 185 }, 18, true);

  function clearLight() {
    for (const name of ['--light-x', '--light-y', '--pitch', '--yaw']) toolbar.style.removeProperty(name);
  }
  toolbar.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches ||
        document.documentElement.dataset.seikaMotion === 'off') return;
    const bounds = toolbar.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    toolbar.style.setProperty('--light-x', `${x * 100}%`);
    toolbar.style.setProperty('--light-y', `${y * 100}%`);
    toolbar.style.setProperty('--pitch', `${(.5 - y) * 19}deg`);
    toolbar.style.setProperty('--yaw', `${(x - .5) * 32}deg`);
  });
  toolbar.addEventListener('pointerleave', clearLight);
})();
