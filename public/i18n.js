/* Static, local English/Spanish presentation. English remains the source text;
   language changes never replace markup, routes, form values or request state. */
(() => {
  'use strict';
  const header = document.querySelector('.site-header');
  const contact = header?.querySelector('.header-cta');
  if (!header || !contact) return;

  const storageKey = 'aekr-language';
  const normalize = value => value.replace(/\s+/g, ' ').trim();
  const spanish = new Map([
    ['AEKR — AI-native, human-orchestrated software engineering', 'AEKR — Ingeniería de software nativa en IA, orquestada por personas'],
    ['AEKR is an AI-native, human-orchestrated software engineering practice. We turn ambiguous ideas and operational problems into engineering outcomes you can inspect, verify, and own.', 'AEKR es una práctica de ingeniería de software nativa en IA y orquestada por personas. Convertimos ideas ambiguas y problemas operativos en resultados de ingeniería que puedes inspeccionar, verificar y hacer tuyos.'],
    ['Orchestration, verification, control. AEKR turns ambiguous ideas into engineering outcomes you can inspect, verify, and own.', 'Orquestación, verificación, control. AEKR convierte ideas ambiguas en resultados de ingeniería que puedes inspeccionar, verificar y hacer tuyos.'],
    ['Skip to content', 'Ir al contenido'],
    ['Menu', 'Menú'],
    ['AEKR — home', 'AEKR — inicio'],
    ['Primary', 'Principal'],
    ['Practice', 'Práctica'],
    ['Orchestration', 'Orquestación'],
    ['Lifecycle', 'Ciclo de entrega'],
    ['Engagements', 'Modalidades'],
    ['Contact', 'Contacto'],
    ['Sections', 'Secciones'],
    ['The practice', 'La práctica'],
    ['Control model', 'Modelo de control'],
    ['Delivery lifecycle', 'Ciclo de entrega'],
    ['Why this model', 'Por qué este modelo'],
    ['Verification', 'Verificación'],
    ['An AI-native, human-orchestrated software engineering practice. We turn ambiguous ideas and operational problems into engineering outcomes you can inspect, verify, and own.', 'Ingeniería de software nativa en IA, orquestada por personas. Convertimos ideas ambiguas y problemas operativos en resultados de ingeniería que puedes inspeccionar, verificar y hacer tuyos.'],
    ['An AI-native, human-orchestrated software engineering practice. We turn ambiguous ideas and operational problems into engineering outcomes you can inspect, verify, and own. Humans orchestrate. Machines execute.', 'Ingeniería de software nativa en IA, orquestada por personas. Convertimos ideas ambiguas y problemas operativos en resultados de ingeniería que puedes inspeccionar, verificar y hacer tuyos. Las personas orquestan. Las máquinas ejecutan.'],
    ['An AI-native, human-orchestrated engineering practice.', 'Ingeniería nativa en IA, orquestada por personas.'],
    ['Humans orchestrate. Machines execute.', 'Las personas orquestan. Las máquinas ejecutan.'],
    ['From ambiguous ideas to clear engineering direction.', 'De ideas ambiguas a una dirección técnica clara.'],
    ['Engineering outcomes you can inspect, verify, and own.', 'Resultados de ingeniería que puedes inspeccionar, verificar y hacer tuyos.'],
    ['Architecture with intent. Delivery with control.', 'Arquitectura con intención. Entrega con control.'],
    ['Human-led decisions. Evidence at every step.', 'Decisiones humanas. Evidencia en cada paso.'],
    ['Software you can understand, transfer, and own.', 'Software que puedes comprender, transferir y hacer tuyo.'],
    ['Start a conversation', 'Iniciar una conversación'],
    ['How engagements work', 'Cómo trabajamos'],
    ['What AEKR does', 'Qué hace AEKR'],
    ['Most software risk is created before anyone writes code — in scope that was never resolved, architecture that was assumed, and constraints nobody wrote down.', 'Gran parte del riesgo del software surge antes de escribir código: en un alcance sin resolver, una arquitectura que se dio por sentada y restricciones que nadie documentó.'],
    ['AEKR applies AI to engineering work under explicit human control. Agents execute; the engineering judgement, boundaries, and acceptance decisions stay with a person who is accountable for them.', 'AEKR aplica IA al trabajo de ingeniería bajo control humano explícito. Los agentes ejecutan; el criterio técnico, los límites y las decisiones de aceptación siguen en manos de una persona que responde por ellos.'],
    ['Uncertainty first', 'Primero, la incertidumbre'],
    ['The expensive unknowns — scope, architecture, integration, constraints, risk — get resolved before implementation budget is committed.', 'Las incógnitas costosas —alcance, arquitectura, integración, restricciones y riesgo— se resuelven antes de comprometer el presupuesto de implementación.'],
    ['Traceable by construction', 'Trazabilidad desde el diseño'],
    ['Each decision links back to the intent that produced it and forward to the evidence that validates', 'Cada decisión se vincula con la intención que la originó y con la evidencia que'],
    ['Bounded execution', 'Ejecución con límites definidos'],
    ['Work is decomposed into units small enough to verify and accept individually.', 'El trabajo se divide en unidades lo bastante pequeñas para verificarlas y aceptarlas de forma individual.'],
    ['Transferable output', 'Entregables transferibles'],
    ['Documentation, architecture, and repositories stay useful to any competent engineering team.', 'La documentación, la arquitectura y los repositorios siguen siendo útiles para cualquier equipo de ingeniería competente.'],
    ['Human intent and governance hold the centre. Bounded engineering work is organised around', 'La intención humana y la gobernanza ocupan el centro. El trabajo de ingeniería, con límites definidos, se organiza a su'],
    ['That is the idea behind the name. Direction does not emerge from the tooling — it is set by a person, and everything the agents do is arranged around that centre.', 'Esa es la idea detrás del nombre. La dirección no surge de las herramientas: la establece una persona, y todo lo que hacen los agentes se organiza alrededor de ese centro.'],
    ['work unit', 'unidad de trabajo'],
    ['A bounded piece of work with its own scope, acceptance criteria, and evidence.', 'Una unidad de trabajo con límites definidos, alcance, criterios de aceptación y evidencia propios.'],
    ['execution step', 'paso de ejecución'],
    ['A smaller step inside a Quark, sized so it can be executed and checked in a single pass.', 'Un paso más pequeño dentro de un Quark, dimensionado para ejecutarlo y comprobarlo en una sola pasada.'],
    ['conformance review', 'revisión de conformidad'],
    ['Intent, requirements, design, implementation, and evidence compared against the agreed acceptance criteria.', 'La intención, los requisitos, el diseño, la implementación y la evidencia se contrastan con los criterios de aceptación acordados.'],
    ['Quarks and Q-Spins are units of work, not autonomous agents. Nothing advances past a gate without a person authorising', 'Quarks y Q-Spins son unidades de trabajo, no agentes autónomos. Nada avanza más allá de un punto de control sin que una persona'],
    ['How the work progresses', 'Cómo avanza el trabajo'],
    ['Seven stages, each with an explicit exit. Interferometry runs across them as the verification layer rather than a stage of its own.', 'Siete etapas, cada una con una salida explícita. Interferometry las recorre como capa de verificación, sin constituir una etapa adicional.'],
    ['Idea & problem framing', 'Definición de la idea y del problema'],
    ['What the problem actually is, who it affects, and what a good outcome looks like.', 'Cuál es realmente el problema, a quién afecta y cómo sería un buen resultado.'],
    ['Requirements, workflows, constraints, dependencies, and the assumptions being made explicit.', 'Se hacen explícitos los requisitos, los flujos de trabajo, las restricciones, las dependencias y los supuestos.'],
    ['Design', 'Diseño'],
    ['Architecture, interfaces, data and integration shape, and the technical direction that follows from them.', 'La arquitectura, las interfaces, la estructura de datos e integraciones y la dirección técnica que se deriva de ellas.'],
    ['Build', 'Construcción'],
    ['Implementation executed as Quarks and Q-Spins, so progress stays visible and reversible at every step.', 'La implementación se ejecuta mediante Quarks y Q-Spins, para que el avance sea visible y reversible en cada paso.'],
    ['Testing & validation', 'Pruebas y validación'],
    ['Behaviour tested against acceptance criteria, with unit-level checks recorded as Flavor Review.', 'El comportamiento se prueba contra los criterios de aceptación, con comprobaciones por unidad registradas como Flavor Review.'],
    ['Release', 'Publicación'],
    ['A release that is authorised, reproducible, and able to be rolled back.', 'Una versión autorizada y reproducible, con posibilidad de volver a la anterior.'],
    ['Delivery & handoff', 'Entrega y transferencia'],
    ['Handover of the software, the decisions behind it, and the documentation needed to keep owning', 'Entrega del software, las decisiones que lo sustentan y la documentación necesaria para seguir siendo su'],
    ['Verification crosses the lifecycle at each gate — comparing what was intended, what was designed, what was built, and what the evidence shows.', 'La verificación recorre el ciclo en cada punto de control: compara lo que se pretendía, lo que se diseñó, lo que se construyó y lo que demuestra la evidencia.'],
    ['One project. Different depths of completion.', 'Un proyecto. Distintos niveles de entrega.'],
    ['AEKR engagements are structured as progressive degrees of engineering completion. You decide how far we carry the work.', 'Las modalidades de AEKR se estructuran en niveles progresivos de entrega de ingeniería. Tú decides hasta dónde llevamos el trabajo.'],
    ['Start with clarity — what should be built, why, on what architecture, and what it will realistically take. Continue into engineering structure and implementation when the case for it is made, not before.', 'Comienza con claridad: qué se debe construir, por qué, sobre qué arquitectura y qué requerirá en la práctica. Avanza hacia la estructura técnica y la implementación cuando estén justificadas.'],
    ['Each depth begins from work already accepted, so the same engineering effort is not paid for twice.', 'Cada nivel parte de trabajo ya aceptado, para no pagar dos veces por el mismo esfuerzo de ingeniería.'],
    ['Staged investment with explicit acceptance boundaries', 'Inversión por etapas con límites de aceptación explícitos'],
    ['Documented decisions you can audit', 'Decisiones documentadas que puedes auditar'],
    ['Artifacts that transfer to any competent team', 'Artefactos transferibles a cualquier equipo competente'],
    ['What you receive at any depth stands on its own. If another team carries the project forward, the work still holds.', 'Lo que recibes en cada nivel tiene valor por sí mismo. Si otro equipo continúa el proyecto, el trabajo conserva su utilidad.'],
    ['See how engagements are structured', 'Conocer las modalidades de trabajo'],
    ['Controlled engineering, accelerated', 'Ingeniería controlada, más rápida'],
    ['The value is not that AI writes code faster. It is that the expensive decisions get made earlier, on evidence, with someone accountable for them.', 'El valor está en tomar antes las decisiones costosas, con evidencia y con una persona responsable de ellas, más allá de escribir código más rápido con IA.'],
    ['Reduced uncertainty', 'Menos incertidumbre'],
    ['Scope, architecture, and risk resolved before the heavy spending starts.', 'Alcance, arquitectura y riesgo resueltos antes de comenzar la inversión fuerte.'],
    ['Controlled investment', 'Inversión controlada'],
    ['Commit at each depth on the strength of what the last one produced.', 'Decide la inversión de cada nivel a partir de los resultados del anterior.'],
    ['Traceable decisions', 'Decisiones trazables'],
    ['Why something was built a certain way stays recoverable long afterward.', 'Las razones para construir algo de cierta manera siguen disponibles mucho tiempo después.'],
    ['Human accountability', 'Responsabilidad humana'],
    ['A named person authorises what ships, and remains answerable for', 'Una persona identificada autoriza cada entrega y mantiene la responsabilidad por'],
    ['Tell us what you need built', 'Cuéntanos qué necesitas crear'],
    ['AEKR engagements scale with how far you want us to carry the product — from engineering clarity through implementation.', 'Las modalidades de AEKR se ajustan a lo que quieras desarrollar del producto: desde la claridad técnica hasta la implementación.'],
    ['Email', 'Correo electrónico'],
    ['you@company.com', 'tu@empresa.com'],
    ['We reply to this address.', 'Responderemos a esta dirección.'],
    ['Comment', 'Comentario'],
    ['optional', 'opcional'],
    ['What you want to build, the operational problem, or what you would like to know.', 'Qué quieres crear, cuál es el problema operativo o qué te gustaría saber.'],
    ['Company', 'Empresa'],
    ['Send me the pricing by tier', 'Envíame los precios por nivel'],
    ['Send message', 'Enviar mensaje'],
    ['This form needs JavaScript enabled to send your request.', 'Este formulario necesita JavaScript activado para enviar tu solicitud.'],
    ['Thank you.', 'Gracias.'],
    ['We’ll reach out soon.', 'Nos pondremos en contacto pronto.'],
    ['Back to the introduction', 'Volver a la introducción'],
    ['Back', 'Volver'],
    ['Build with AEKR', 'Construye con AEKR'],
    ['AEKR — introduction.', 'AEKR — introducción.'],
    ['AEKR introduction', 'Introducción de AEKR'],
    ['Section', 'Sección'],
    ['of', 'de'],
    ['Enter a valid email address so we can reply.', 'Introduce un correo electrónico válido para que podamos responder.'],
    ['Sending…', 'Enviando…'],
    ["We couldn't send your request. Please try again.", 'No pudimos enviar tu solicitud. Inténtalo de nuevo.'],
  ]);

  let language = 'en';
  try {
    if (localStorage.getItem(storageKey) === 'es') language = 'es';
  } catch { /* An unavailable preference store keeps the fresh English default. */ }

  function text(english) {
    return language === 'es' ? spanish.get(normalize(english)) ?? english : english;
  }

  const control = document.createElement('div');
  control.className = 'language-control';
  const button = document.createElement('button');
  button.id = 'site-language';
  button.type = 'button';
  control.append(button);
  header.insertBefore(control, contact);

  // Preserve the existing inline spans; these five final fragments need their
  // own Spanish grammar rather than a context-free translation of "it.".
  const fragments = new Map();
  for (const [selector, translated] of [
    ['#practice .principles li:nth-child(2) .nowrap', 'la valida.'],
    ['#orchestration > .lede .nowrap', 'alrededor.'],
    ['#orchestration > .note .nowrap', 'lo autorice.'],
    ['#lifecycle .phase:last-child .nowrap', 'propietario.'],
    ['#why .principles li:last-child .nowrap', 'ella.'],
  ]) {
    const node = document.querySelector(selector)?.firstChild;
    if (node) fragments.set(node, translated);
  }

  const nodes = [];
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.parentElement?.closest('script, style, noscript, textarea, .section-status, .form-status, .language-control')) continue;
    const key = normalize(node.data);
    const translated = fragments.get(node) ?? spanish.get(key);
    if (translated !== undefined) {
      nodes.push({ node, english: node.data, spanish: node.data.replace(/\S[\s\S]*\S|\S/, translated) });
    }
  }

  const attributes = [];
  for (const element of document.querySelectorAll('[aria-label], [placeholder], [alt], [title], meta[name="description"], meta[property="og:title"], meta[property="og:description"], meta[name="twitter:title"], meta[name="twitter:description"]')) {
    for (const name of ['aria-label', 'placeholder', 'alt', 'title', 'content']) {
      const english = element.getAttribute(name);
      if (english !== null && spanish.has(normalize(english))) {
        attributes.push({ element, name, english, spanish: spanish.get(normalize(english)) });
      }
    }
  }

  window.AEKRLanguage = Object.freeze({ get language() { return language; }, text });

  function applyLanguage(next) {
    language = next;
    document.documentElement.lang = language;
    button.textContent = language === 'es' ? 'SP' : 'EN';
    button.setAttribute('aria-label', language === 'es'
      ? 'SP: Español. Cambiar a inglés.'
      : 'EN: English. Switch to Spanish.');
    for (const entry of nodes) entry.node.data = entry[language === 'es' ? 'spanish' : 'english'];
    for (const entry of attributes) entry.element.setAttribute(entry.name, entry[language === 'es' ? 'spanish' : 'english']);
    document.dispatchEvent(new CustomEvent('aekr:languagechange', { detail: { language } }));
  }

  button.addEventListener('click', () => {
    const next = language === 'en' ? 'es' : 'en';
    try { localStorage.setItem(storageKey, next); }
    catch { /* The explicit choice still works for the current page. */ }
    applyLanguage(next);
  });
  applyLanguage(language);
})();
