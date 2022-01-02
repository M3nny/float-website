
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function action_destroyer(action_result) {
        return action_result && is_function(action_result.destroy) ? action_result.destroy : noop;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = append_empty_stylesheet(node).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            while (flushidx < dirty_components.length) {
                const component = dirty_components[flushidx];
                flushidx++;
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    const null_transition = { duration: 0 };
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = (program.b - t);
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.3' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /** @type {import(types').HasSingleTextNode} */
    const hasSingleTextNode = el => el.childNodes.length === 1 && el.childNodes[0].nodeType === 3;

    /** @type {import(types').CreateElement} */
    const createElement = (text, elementTag) => {
    	const element = document.createElement(elementTag);
    	element.textContent = text;
    	return element
    };

    const filterOutStaticElements = child => child.dataset.static === undefined;

    /** @type {import(types').GetElements} */
    const getElements = (node, { parentElement }) => {
    	if (hasSingleTextNode(parentElement)) {
    		const text = parentElement.textContent;
    		const childNode = createElement(parentElement.textContent, 'p');
    		parentElement.textContent = '';
    		parentElement.appendChild(childNode);
    		return [{ currentNode: childNode, text }]
    	}

    	if (hasSingleTextNode(node)) {
    		const textWithFilteredAmpersand = node.innerHTML.replaceAll('&amp;', '&');
    		return [{ currentNode: node, text: textWithFilteredAmpersand }]
    	} else {
    		const children = [...node.children].filter(filterOutStaticElements);
    		const allChildren = children.flatMap(child => getElements(child, { parentElement }));
    		return allChildren
    	}
    };

    const runOnEveryParentUntil = async (element, parent, callback) => {
    	if (!parent) {
    		console.error('The specified parent element does not exists!');
    		return
    	}

    	let currentElement = element;
    	do {
    		if (currentElement === parent) return

    		callback(currentElement);

    		currentElement = currentElement.parentElement || currentElement.parentNode;
    	} while (currentElement !== null && currentElement.nodeType === 1)
    };

    const makeNestedStaticElementsVisible = parentElement => {
    	const staticElements = [...parentElement.querySelectorAll('[data-static]')];
    	for (const staticElement of staticElements) {
    		runOnEveryParentUntil(staticElement, parentElement, currentStaticElement => {
    			const isParentElement = currentStaticElement !== staticElement;
    			isParentElement && currentStaticElement.classList.add('finished-typing');
    		});
    	}
    };

    const getSelectedMode = async options => {
    	if (options.loop || options.loopRandom) {
    		return (await Promise.resolve().then(function () { return loopTypewriter$1; })).mode
    	} else if (options.scramble) {
    		return (await Promise.resolve().then(function () { return scramble; })).mode
    	} else {
    		return (await Promise.resolve().then(function () { return typewriter; })).mode
    	}
    };

    /** @type {import('types').TypewriterMainFn} */
    const typewriter$1 = async (node, options) => {
    	makeNestedStaticElementsVisible(node);
    	const mode = await getSelectedMode(options);
    	const elements = getElements(node, { parentElement: node, ...options });
    	if (options.delay > 0) {
    		const { sleep } = await Promise.resolve().then(function () { return sleep$1; });
    		await sleep(options.delay);
    		node.classList.remove('delay');
    	}
    	mode(elements, { parentElement: node, ...options });
    };

    /* node_modules/svelte-typewriter/src/Typewriter.svelte generated by Svelte v3.44.3 */
    const file$2 = "node_modules/svelte-typewriter/src/Typewriter.svelte";

    function create_fragment$2(ctx) {
    	let div;
    	let typewriter_action;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "typewriter-container svelte-cjgu4b");

    			set_style(div, "--cursor-color", typeof /*cursor*/ ctx[0] === 'string'
    			? /*cursor*/ ctx[0]
    			: 'black');

    			toggle_class(div, "cursor", /*cursor*/ ctx[0]);
    			toggle_class(div, "delay", /*options*/ ctx[1].delay > 0);
    			add_location(div, file$2, 62, 0, 1150);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = action_destroyer(typewriter_action = typewriter$1.call(null, div, /*options*/ ctx[1]));
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 512)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, null),
    						null
    					);
    				}
    			}

    			if (!current || dirty & /*cursor*/ 1) {
    				set_style(div, "--cursor-color", typeof /*cursor*/ ctx[0] === 'string'
    				? /*cursor*/ ctx[0]
    				: 'black');
    			}

    			if (typewriter_action && is_function(typewriter_action.update) && dirty & /*options*/ 2) typewriter_action.update.call(null, /*options*/ ctx[1]);

    			if (dirty & /*cursor*/ 1) {
    				toggle_class(div, "cursor", /*cursor*/ ctx[0]);
    			}

    			if (dirty & /*options*/ 2) {
    				toggle_class(div, "delay", /*options*/ ctx[1].delay > 0);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let options;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Typewriter', slots, ['default']);
    	let { interval = 30 } = $$props;
    	let { cascade = false } = $$props;
    	let { loop = false } = $$props;
    	let { loopRandom = false } = $$props;
    	let { scramble = false } = $$props;
    	let { scrambleSlowdown = scramble ? true : false } = $$props;
    	let { cursor = true } = $$props;
    	let { delay = 0 } = $$props;
    	const dispatch = createEventDispatcher();

    	const writable_props = [
    		'interval',
    		'cascade',
    		'loop',
    		'loopRandom',
    		'scramble',
    		'scrambleSlowdown',
    		'cursor',
    		'delay'
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Typewriter> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('interval' in $$props) $$invalidate(2, interval = $$props.interval);
    		if ('cascade' in $$props) $$invalidate(3, cascade = $$props.cascade);
    		if ('loop' in $$props) $$invalidate(4, loop = $$props.loop);
    		if ('loopRandom' in $$props) $$invalidate(5, loopRandom = $$props.loopRandom);
    		if ('scramble' in $$props) $$invalidate(6, scramble = $$props.scramble);
    		if ('scrambleSlowdown' in $$props) $$invalidate(7, scrambleSlowdown = $$props.scrambleSlowdown);
    		if ('cursor' in $$props) $$invalidate(0, cursor = $$props.cursor);
    		if ('delay' in $$props) $$invalidate(8, delay = $$props.delay);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		typewriter: typewriter$1,
    		interval,
    		cascade,
    		loop,
    		loopRandom,
    		scramble,
    		scrambleSlowdown,
    		cursor,
    		delay,
    		dispatch,
    		options
    	});

    	$$self.$inject_state = $$props => {
    		if ('interval' in $$props) $$invalidate(2, interval = $$props.interval);
    		if ('cascade' in $$props) $$invalidate(3, cascade = $$props.cascade);
    		if ('loop' in $$props) $$invalidate(4, loop = $$props.loop);
    		if ('loopRandom' in $$props) $$invalidate(5, loopRandom = $$props.loopRandom);
    		if ('scramble' in $$props) $$invalidate(6, scramble = $$props.scramble);
    		if ('scrambleSlowdown' in $$props) $$invalidate(7, scrambleSlowdown = $$props.scrambleSlowdown);
    		if ('cursor' in $$props) $$invalidate(0, cursor = $$props.cursor);
    		if ('delay' in $$props) $$invalidate(8, delay = $$props.delay);
    		if ('options' in $$props) $$invalidate(1, options = $$props.options);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*interval, cascade, loop, loopRandom, scramble, scrambleSlowdown, cursor, delay*/ 509) {
    			$$invalidate(1, options = {
    				interval,
    				cascade,
    				loop,
    				loopRandom,
    				scramble,
    				scrambleSlowdown,
    				cursor,
    				delay,
    				dispatch
    			});
    		}
    	};

    	return [
    		cursor,
    		options,
    		interval,
    		cascade,
    		loop,
    		loopRandom,
    		scramble,
    		scrambleSlowdown,
    		delay,
    		$$scope,
    		slots
    	];
    }

    class Typewriter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {
    			interval: 2,
    			cascade: 3,
    			loop: 4,
    			loopRandom: 5,
    			scramble: 6,
    			scrambleSlowdown: 7,
    			cursor: 0,
    			delay: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Typewriter",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get interval() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set interval(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cascade() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cascade(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loop() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loop(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loopRandom() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loopRandom(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scramble() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scramble(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scrambleSlowdown() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scrambleSlowdown(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get cursor() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set cursor(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get delay() {
    		throw new Error("<Typewriter>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set delay(value) {
    		throw new Error("<Typewriter>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/Visibility.svelte generated by Svelte v3.44.3 */
    const file$1 = "src/Visibility.svelte";

    const get_default_slot_changes = dirty => ({
    	percent: dirty & /*percent*/ 2,
    	unobserve: dirty & /*unobserve*/ 4,
    	intersectionObserverSupport: dirty & /*intersectionObserverSupport*/ 8
    });

    const get_default_slot_context = ctx => ({
    	percent: /*percent*/ ctx[1],
    	unobserve: /*unobserve*/ ctx[2],
    	intersectionObserverSupport: /*intersectionObserverSupport*/ ctx[3]
    });

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*#slots*/ ctx[10].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[9], get_default_slot_context);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			add_location(div, file$1, 48, 0, 1261);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			/*div_binding*/ ctx[11](div);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope, percent, unobserve, intersectionObserverSupport*/ 526)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[9],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[9])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[9], dirty, get_default_slot_changes),
    						get_default_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    			/*div_binding*/ ctx[11](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function stepsToThreshold(steps) {
    	return [...Array(steps).keys()].map(n => n / steps);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Visibility', slots, ['default']);
    	let { top = 0 } = $$props;
    	let { bottom = 0 } = $$props;
    	let { left = 0 } = $$props;
    	let { right = 0 } = $$props;
    	let { steps = 100 } = $$props;
    	let element;
    	let percent;
    	let observer;

    	let unobserve = () => {
    		
    	};

    	let intersectionObserverSupport = false;

    	function intersectPercent(entries) {
    		entries.forEach(entry => {
    			$$invalidate(1, percent = Math.round(Math.ceil(entry.intersectionRatio * 100)));
    		});
    	}

    	onMount(() => {
    		$$invalidate(3, intersectionObserverSupport = 'IntersectionObserver' in window && 'IntersectionObserverEntry' in window && 'intersectionRatio' in window.IntersectionObserverEntry.prototype);

    		const options = {
    			rootMargin: `${top}px ${right}px ${bottom}px ${left}px`,
    			threshold: stepsToThreshold(steps)
    		};

    		if (intersectionObserverSupport) {
    			observer = new IntersectionObserver(intersectPercent, options);
    			observer.observe(element);
    			$$invalidate(2, unobserve = () => observer.unobserve(element));
    		}

    		return unobserve;
    	});

    	const writable_props = ['top', 'bottom', 'left', 'right', 'steps'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Visibility> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			element = $$value;
    			$$invalidate(0, element);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ('top' in $$props) $$invalidate(4, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(5, bottom = $$props.bottom);
    		if ('left' in $$props) $$invalidate(6, left = $$props.left);
    		if ('right' in $$props) $$invalidate(7, right = $$props.right);
    		if ('steps' in $$props) $$invalidate(8, steps = $$props.steps);
    		if ('$$scope' in $$props) $$invalidate(9, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		top,
    		bottom,
    		left,
    		right,
    		steps,
    		element,
    		percent,
    		observer,
    		unobserve,
    		intersectionObserverSupport,
    		intersectPercent,
    		stepsToThreshold
    	});

    	$$self.$inject_state = $$props => {
    		if ('top' in $$props) $$invalidate(4, top = $$props.top);
    		if ('bottom' in $$props) $$invalidate(5, bottom = $$props.bottom);
    		if ('left' in $$props) $$invalidate(6, left = $$props.left);
    		if ('right' in $$props) $$invalidate(7, right = $$props.right);
    		if ('steps' in $$props) $$invalidate(8, steps = $$props.steps);
    		if ('element' in $$props) $$invalidate(0, element = $$props.element);
    		if ('percent' in $$props) $$invalidate(1, percent = $$props.percent);
    		if ('observer' in $$props) observer = $$props.observer;
    		if ('unobserve' in $$props) $$invalidate(2, unobserve = $$props.unobserve);
    		if ('intersectionObserverSupport' in $$props) $$invalidate(3, intersectionObserverSupport = $$props.intersectionObserverSupport);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		element,
    		percent,
    		unobserve,
    		intersectionObserverSupport,
    		top,
    		bottom,
    		left,
    		right,
    		steps,
    		$$scope,
    		slots,
    		div_binding
    	];
    }

    class Visibility extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
    			top: 4,
    			bottom: 5,
    			left: 6,
    			right: 7,
    			steps: 8
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Visibility",
    			options,
    			id: create_fragment$1.name
    		});
    	}

    	get top() {
    		throw new Error("<Visibility>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set top(value) {
    		throw new Error("<Visibility>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get bottom() {
    		throw new Error("<Visibility>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set bottom(value) {
    		throw new Error("<Visibility>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get left() {
    		throw new Error("<Visibility>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set left(value) {
    		throw new Error("<Visibility>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get right() {
    		throw new Error("<Visibility>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set right(value) {
    		throw new Error("<Visibility>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get steps() {
    		throw new Error("<Visibility>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set steps(value) {
    		throw new Error("<Visibility>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.44.3 */
    const file = "src/App.svelte";

    // (33:3) <Typewriter interval={150} cursor={false}>
    function create_default_slot_1(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Welcome";
    			attr_dev(h2, "id", "text");
    			add_location(h2, file, 33, 4, 954);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h2, anchor);
    			/*h2_binding*/ ctx[7](h2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h2);
    			/*h2_binding*/ ctx[7](null);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(33:3) <Typewriter interval={150} cursor={false}>",
    		ctx
    	});

    	return block;
    }

    // (48:4) {#if percent < 50}
    function create_if_block(ctx) {
    	let div5;
    	let div0;
    	let svg0;
    	let path0;
    	let t0;
    	let p0;
    	let t2;
    	let p1;
    	let t3;
    	let br0;
    	let t4;
    	let div0_transition;
    	let t5;
    	let div1;
    	let svg1;
    	let path1;
    	let t6;
    	let p2;
    	let t8;
    	let p3;
    	let t9;
    	let br1;
    	let t10;
    	let div1_transition;
    	let t11;
    	let div2;
    	let svg2;
    	let path2;
    	let t12;
    	let p4;
    	let t14;
    	let p5;
    	let t15;
    	let br2;
    	let t16;
    	let div2_transition;
    	let t17;
    	let div3;
    	let t18;
    	let div4;
    	let svg3;
    	let path3;
    	let t19;
    	let p6;
    	let t21;
    	let p7;
    	let t22;
    	let br3;
    	let t23;
    	let div4_transition;
    	let t24;
    	let div8;
    	let button;
    	let div7;
    	let img;
    	let img_src_value;
    	let t25;
    	let div6;
    	let current;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t0 = space();
    			p0 = element("p");
    			p0.textContent = "Simple and easy";
    			t2 = space();
    			p1 = element("p");
    			t3 = text("Only a few commands ");
    			br0 = element("br");
    			t4 = text(" without any distractions.");
    			t5 = space();
    			div1 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t6 = space();
    			p2 = element("p");
    			p2.textContent = "Anti-afk";
    			t8 = space();
    			p3 = element("p");
    			t9 = text("Float leaves the room automatically ");
    			br1 = element("br");
    			t10 = text(" after being inactive for a period of time.");
    			t11 = space();
    			div2 = element("div");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t12 = space();
    			p4 = element("p");
    			p4.textContent = "Music from youtube like no others";
    			t14 = space();
    			p5 = element("p");
    			t15 = text("The music is streamed from youtube ");
    			br2 = element("br");
    			t16 = text(" providing a fast experience.");
    			t17 = space();
    			div3 = element("div");
    			t18 = space();
    			div4 = element("div");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t19 = space();
    			p6 = element("p");
    			p6.textContent = "Slash commands";
    			t21 = space();
    			p7 = element("p");
    			t22 = text("Write commands faster ");
    			br3 = element("br");
    			t23 = text(" using the slashed notation.");
    			t24 = space();
    			div8 = element("div");
    			button = element("button");
    			div7 = element("div");
    			img = element("img");
    			t25 = space();
    			div6 = element("div");
    			div6.textContent = "invite";
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z");
    			add_location(path0, file, 52, 8, 1693);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "h-6 w-6");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "gray");
    			add_location(svg0, file, 51, 7, 1582);
    			attr_dev(p0, "class", "text-xl text-cyan-600");
    			add_location(p0, file, 54, 7, 1837);
    			add_location(br0, file, 55, 52, 1942);
    			attr_dev(p1, "class", "text-slate-50");
    			add_location(p1, file, 55, 7, 1897);
    			add_location(div0, file, 50, 6, 1524);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636");
    			add_location(path1, file, 60, 8, 2165);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "h-6 w-6");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "gray");
    			add_location(svg1, file, 59, 7, 2054);
    			attr_dev(p2, "class", "text-xl text-cyan-600");
    			add_location(p2, file, 62, 7, 2358);
    			add_location(br1, file, 63, 68, 2472);
    			attr_dev(p3, "class", "text-slate-50");
    			add_location(p3, file, 63, 7, 2411);
    			add_location(div1, file, 58, 6, 1997);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3");
    			add_location(path2, file, 68, 8, 2712);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "class", "h-6 w-6");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke", "gray");
    			add_location(svg2, file, 67, 7, 2601);
    			attr_dev(p4, "class", "text-xl text-cyan-600");
    			add_location(p4, file, 70, 7, 2958);
    			add_location(br2, file, 71, 67, 3096);
    			attr_dev(p5, "class", "text-slate-50");
    			add_location(p5, file, 71, 7, 3036);
    			add_location(div2, file, 66, 6, 2544);
    			add_location(div3, file, 74, 6, 3154);
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "stroke-width", "2");
    			attr_dev(path3, "d", "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z");
    			add_location(path3, file, 78, 8, 3347);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "class", "h-6 w-6");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "stroke", "gray");
    			add_location(svg3, file, 77, 7, 3236);
    			attr_dev(p6, "class", "text-xl text-cyan-600");
    			add_location(p6, file, 80, 7, 3550);
    			add_location(br3, file, 81, 54, 3656);
    			attr_dev(p7, "class", "text-slate-50");
    			add_location(p7, file, 81, 7, 3609);
    			add_location(div4, file, 76, 6, 3173);
    			attr_dev(div5, "class", "h-56 grid grid-cols-3 gap-4 content-center my-10");
    			add_location(div5, file, 48, 5, 1448);
    			if (!src_url_equal(img.src, img_src_value = "images/discord_logo.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "dl");
    			attr_dev(img, "class", "mx-auto object-contain h-10 w-10");
    			add_location(img, file, 87, 8, 3961);
    			attr_dev(div6, "class", "mx-5");
    			add_location(div6, file, 88, 8, 4058);
    			attr_dev(div7, "class", "flex items-center");
    			add_location(div7, file, 86, 7, 3921);
    			attr_dev(button, "class", "bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded");
    			add_location(button, file, 85, 6, 3779);
    			attr_dev(div8, "class", "flex flex-wrap justify-center my-20");
    			add_location(div8, file, 84, 5, 3723);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div0, t0);
    			append_dev(div0, p0);
    			append_dev(div0, t2);
    			append_dev(div0, p1);
    			append_dev(p1, t3);
    			append_dev(p1, br0);
    			append_dev(p1, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div1);
    			append_dev(div1, svg1);
    			append_dev(svg1, path1);
    			append_dev(div1, t6);
    			append_dev(div1, p2);
    			append_dev(div1, t8);
    			append_dev(div1, p3);
    			append_dev(p3, t9);
    			append_dev(p3, br1);
    			append_dev(p3, t10);
    			append_dev(div5, t11);
    			append_dev(div5, div2);
    			append_dev(div2, svg2);
    			append_dev(svg2, path2);
    			append_dev(div2, t12);
    			append_dev(div2, p4);
    			append_dev(div2, t14);
    			append_dev(div2, p5);
    			append_dev(p5, t15);
    			append_dev(p5, br2);
    			append_dev(p5, t16);
    			append_dev(div5, t17);
    			append_dev(div5, div3);
    			append_dev(div5, t18);
    			append_dev(div5, div4);
    			append_dev(div4, svg3);
    			append_dev(svg3, path3);
    			append_dev(div4, t19);
    			append_dev(div4, p6);
    			append_dev(div4, t21);
    			append_dev(div4, p7);
    			append_dev(p7, t22);
    			append_dev(p7, br3);
    			append_dev(p7, t23);
    			insert_dev(target, t24, anchor);
    			insert_dev(target, div8, anchor);
    			append_dev(div8, button);
    			append_dev(button, div7);
    			append_dev(div7, img);
    			append_dev(div7, t25);
    			append_dev(div7, div6);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { x: -500, duration: 1000 }, true);
    				div0_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: 500, duration: 1000 }, true);
    				div1_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { x: 500, duration: 1000 }, true);
    				div2_transition.run(1);
    			});

    			add_render_callback(() => {
    				if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, { duration: 2000, delay: 1000 }, true);
    				div4_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div0_transition) div0_transition = create_bidirectional_transition(div0, fly, { x: -500, duration: 1000 }, false);
    			div0_transition.run(0);
    			if (!div1_transition) div1_transition = create_bidirectional_transition(div1, fly, { y: 500, duration: 1000 }, false);
    			div1_transition.run(0);
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fly, { x: 500, duration: 1000 }, false);
    			div2_transition.run(0);
    			if (!div4_transition) div4_transition = create_bidirectional_transition(div4, fade, { duration: 2000, delay: 1000 }, false);
    			div4_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			if (detaching && div0_transition) div0_transition.end();
    			if (detaching && div1_transition) div1_transition.end();
    			if (detaching && div2_transition) div2_transition.end();
    			if (detaching && div4_transition) div4_transition.end();
    			if (detaching) detach_dev(t24);
    			if (detaching) detach_dev(div8);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(48:4) {#if percent < 50}",
    		ctx
    	});

    	return block;
    }

    // (27:1) <Visibility steps={100} let:percent let:unobserve let:intersectionObserverSupport>
    function create_default_slot(ctx) {
    	let section;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let img2;
    	let img2_src_value;
    	let t2;
    	let typewriter;
    	let t3;
    	let div3;
    	let div2;
    	let img3;
    	let img3_src_value;
    	let t4;
    	let div0;
    	let t6;
    	let div1;
    	let h1;
    	let t8;
    	let h2;
    	let t10;
    	let current;

    	typewriter = new Typewriter({
    			props: {
    				interval: 150,
    				cursor: false,
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block = /*percent*/ ctx[8] < 50 && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			section = element("section");
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			img2 = element("img");
    			t2 = space();
    			create_component(typewriter.$$.fragment);
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			img3 = element("img");
    			t4 = space();
    			div0 = element("div");
    			div0.textContent = "asd";
    			t6 = space();
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Float";
    			t8 = space();
    			h2 = element("h2");
    			h2.textContent = "music bot for discord";
    			t10 = space();
    			if (if_block) if_block.c();
    			if (!src_url_equal(img0.src, img0_src_value = "images/background.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "id", "bg");
    			attr_dev(img0, "alt", "background");
    			add_location(img0, file, 28, 3, 629);
    			if (!src_url_equal(img1.src, img1_src_value = "images/floating_island.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "id", "floating_island");
    			attr_dev(img1, "alt", "floating_island");
    			add_location(img1, file, 29, 3, 716);
    			if (!src_url_equal(img2.src, img2_src_value = "images/grass.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "id", "grass");
    			attr_dev(img2, "alt", "grass");
    			add_location(img2, file, 30, 3, 831);
    			add_location(section, file, 27, 2, 616);
    			if (!src_url_equal(img3.src, img3_src_value = "images/bot_icon.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "bi");
    			attr_dev(img3, "class", "mx-auto object-contain h-48 w-96");
    			add_location(img3, file, 39, 4, 1102);
    			attr_dev(div0, "class", "text-right");
    			add_location(div0, file, 40, 4, 1191);
    			attr_dev(h1, "class", "text-center");
    			set_style(h1, "font-size", "50px");
    			add_location(h1, file, 42, 5, 1262);
    			attr_dev(h2, "class", "text-center");
    			set_style(h2, "font-size", "35px");
    			add_location(h2, file, 43, 5, 1327);
    			attr_dev(div1, "class", "text-cyan-700");
    			add_location(div1, file, 41, 4, 1229);
    			add_location(div2, file, 38, 3, 1092);
    			attr_dev(div3, "class", "font-9xl flex flex-wrap justify-center my-8");
    			add_location(div3, file, 37, 2, 1031);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);
    			append_dev(section, img0);
    			/*img0_binding*/ ctx[4](img0);
    			append_dev(section, t0);
    			append_dev(section, img1);
    			/*img1_binding*/ ctx[5](img1);
    			append_dev(section, t1);
    			append_dev(section, img2);
    			/*img2_binding*/ ctx[6](img2);
    			append_dev(section, t2);
    			mount_component(typewriter, section, null);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, img3);
    			append_dev(div2, t4);
    			append_dev(div2, div0);
    			append_dev(div2, t6);
    			append_dev(div2, div1);
    			append_dev(div1, h1);
    			append_dev(div1, t8);
    			append_dev(div1, h2);
    			append_dev(div2, t10);
    			if (if_block) if_block.m(div2, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const typewriter_changes = {};

    			if (dirty & /*$$scope, text*/ 2056) {
    				typewriter_changes.$$scope = { dirty, ctx };
    			}

    			typewriter.$set(typewriter_changes);

    			if (/*percent*/ ctx[8] < 50) {
    				if (if_block) {
    					if (dirty & /*percent*/ 256) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(div2, null);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(typewriter.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(typewriter.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			/*img0_binding*/ ctx[4](null);
    			/*img1_binding*/ ctx[5](null);
    			/*img2_binding*/ ctx[6](null);
    			destroy_component(typewriter);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div3);
    			if (if_block) if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(27:1) <Visibility steps={100} let:percent let:unobserve let:intersectionObserverSupport>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let visibility;
    	let current;

    	visibility = new Visibility({
    			props: {
    				steps: 100,
    				$$slots: {
    					default: [
    						create_default_slot,
    						({ percent, unobserve, intersectionObserverSupport }) => ({
    							8: percent,
    							9: unobserve,
    							10: intersectionObserverSupport
    						}),
    						({ percent, unobserve, intersectionObserverSupport }) => (percent ? 256 : 0) | (unobserve ? 512 : 0) | (intersectionObserverSupport ? 1024 : 0)
    					]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(visibility.$$.fragment);
    			add_location(main, file, 25, 0, 523);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(visibility, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const visibility_changes = {};

    			if (dirty & /*$$scope, percent, text, grass, floating_island, background*/ 2319) {
    				visibility_changes.$$scope = { dirty, ctx };
    			}

    			visibility.$set(visibility_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(visibility.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(visibility.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(visibility);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let background;
    	let floating_island;
    	let grass;
    	let text;

    	window.addEventListener('scroll', function () {
    		var value = window.scrollY;
    		$$invalidate(0, background.style.top = value * 0.5 + 'px', background);
    		$$invalidate(1, floating_island.style.left = -value * 0.5 + 'px', floating_island);
    		$$invalidate(2, grass.style.top = value * 0.15 + 'px', grass);
    		$$invalidate(3, text.style.top = value * 1 + 'px', text);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function img0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			background = $$value;
    			$$invalidate(0, background);
    		});
    	}

    	function img1_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			floating_island = $$value;
    			$$invalidate(1, floating_island);
    		});
    	}

    	function img2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			grass = $$value;
    			$$invalidate(2, grass);
    		});
    	}

    	function h2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			text = $$value;
    			$$invalidate(3, text);
    		});
    	}

    	$$self.$capture_state = () => ({
    		Typewriter,
    		fly,
    		fade,
    		Visibility,
    		background,
    		floating_island,
    		grass,
    		text
    	});

    	$$self.$inject_state = $$props => {
    		if ('background' in $$props) $$invalidate(0, background = $$props.background);
    		if ('floating_island' in $$props) $$invalidate(1, floating_island = $$props.floating_island);
    		if ('grass' in $$props) $$invalidate(2, grass = $$props.grass);
    		if ('text' in $$props) $$invalidate(3, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		background,
    		floating_island,
    		grass,
    		text,
    		img0_binding,
    		img1_binding,
    		img2_binding,
    		h2_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	intro: true
    });

    /** @type {import(types').Sleep} */
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    var sleep$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        sleep: sleep
    });

    /** @type {import(types').RandomNumberGenerator} */
    const rng = (min, max) => Math.floor(Math.random() * (max - min) + min);

    /** @type {import(types').TypingInterval} */
    const typingInterval = async interval =>
    	sleep(Array.isArray(interval) ? interval[rng(0, interval.length)] : interval);

    /** @type {import(types').TypewriterEffectFn} */
    const writeEffect = async ({ currentNode, text }, options) => {
    	runOnEveryParentUntil(currentNode, options.parentElement, element => {
    		const classToAdd = currentNode === element ? 'typing' : 'finished-typing';
    		element.classList.add(classToAdd);
    	});
    	for (let index = 0; index <= text.length; index++) {
    		const char = text[index];
    		char === '<' && (index = text.indexOf('>', index));
    		currentNode.innerHTML = text.slice(0, index);
    		await typingInterval(options.interval);
    	}
    };

    /** @type {import(types').UnwriteEffect} */
    const unwriteEffect = async (currentNode, options) => {
    	options.dispatch('done');
    	await typingInterval(typeof options.loop === 'number' ? options.loop : 1500);
    	const text = currentNode.innerHTML.replaceAll('&amp;', '&');
    	for (let index = text.length - 1; index >= 0; index--) {
    		const letter = text[index];
    		letter === '>' && (index = text.lastIndexOf('<', index));
    		currentNode.innerHTML = text.slice(0, index);
    		await typingInterval(options.interval);
    	}
    };

    /** @type {any[]} */
    let alreadyChoosenTexts = [];

    /** @type {import(types').GetRandomText} */
    const getRandomElement = elements => {
    	while (true) {
    		const randomIndex = rng(0, elements.length);
    		// After each iteration, avoid repeating the last text from the last iteration
    		const isTextDifferentFromPrevious =
    			typeof alreadyChoosenTexts === 'number' && randomIndex !== alreadyChoosenTexts;
    		const isTextFirstTime =
    			Array.isArray(alreadyChoosenTexts) && !alreadyChoosenTexts.includes(randomIndex);
    		const hasSingleChildElement = elements.length === 1;
    		const shouldAnimate =
    			hasSingleChildElement || isTextFirstTime || isTextDifferentFromPrevious;
    		if (shouldAnimate) {
    			isTextDifferentFromPrevious && (alreadyChoosenTexts = []);
    			alreadyChoosenTexts.push(randomIndex);
    			const randomText = elements[randomIndex];
    			return randomText
    		}
    		const restartRandomizationCycle = alreadyChoosenTexts.length === elements.length;
    		restartRandomizationCycle && (alreadyChoosenTexts = alreadyChoosenTexts.pop());
    	}
    };

    /** @type {import('types').TypewriterEffectFn} */
    const loopTypewriter = async ({ currentNode, text }, options) => {
    	await writeEffect({ currentNode, text }, options);
    	const textWithUnescapedAmpersands = text.replaceAll('&', '&amp;');
    	const fullyWritten = currentNode.innerHTML === textWithUnescapedAmpersands;
    	fullyWritten && (await unwriteEffect(currentNode, options));
    	runOnEveryParentUntil(currentNode, options.parentElement, element => {
    		currentNode === element
    			? element.classList.remove('typing')
    			: element.classList.remove('finished-typing');
    	});
    };

    /** @type {import('types').TypewriterModeFn} */
    const mode$2 = async (elements, options) => {
    	while (true) {
    		if (options.loop) {
    			for (const element of elements) await loopTypewriter(element, options);
    		} else if (options.loopRandom) {
    			const element = getRandomElement(elements);
    			await loopTypewriter(element, options);
    		}
    	}
    };

    var loopTypewriter$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        mode: mode$2
    });

    const getRandomNumber = (min, max) => Math.floor(Math.random() * (max - min)) + min;

    const getRandomLetter = () => {
    	const possibleLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'.split(
    		''
    	);
    	const letterIndexLimit = possibleLetters.length;
    	const randomLetterIndex = getRandomNumber(0, letterIndexLimit);
    	const randomLetter = possibleLetters[randomLetterIndex];
    	return randomLetter
    };

    // returns a array with a timeout (in ms) for each letter of the word
    const getLettersTimeout = (textLetters, timeout) => {
    	const minimumTimeoutPossible = timeout / 3;
    	// TODO: find a better way to deal with this instead of explicitly reducing the maximum timeout
    	// otherwise, at the end of the animation, one or two characters remain scrambled
    	const lettersTimeout = textLetters.map(() =>
    		getRandomNumber(minimumTimeoutPossible, timeout - 100)
    	);
    	return lettersTimeout
    };

    /** @type {TypewriterModeFn} */
    const mode$1 = async (elements, options) => {
    	const timeout = typeof options.scramble == 'number' ? options.scramble : 3000;
    	await new Promise(resolve => {
    		elements.forEach(async ({ currentNode, text }) => {
    			let wordLetters = text.split('');
    			const lettersTimeout = getLettersTimeout(wordLetters, timeout);
    			const startingTime = Date.now();

    			runOnEveryParentUntil(currentNode, options.parentElement, element => {
    				element.classList.add('finished-typing');
    			});

    			while (Date.now() - startingTime < timeout) {
    				const randomLetterIndex = getRandomNumber(0, wordLetters.length);
    				const randomLetterTimeout = lettersTimeout[randomLetterIndex];
    				const isRandomLetterWhitespace = wordLetters[randomLetterIndex] === ' ';
    				const timeEllapsed = () => Date.now() - startingTime;
    				const didRandomLetterReachTimeout = () => timeEllapsed() >= randomLetterTimeout;

    				if (didRandomLetterReachTimeout() || isRandomLetterWhitespace) {
    					const letterFinishedAnimation =
    						wordLetters[randomLetterIndex] === text[randomLetterIndex];

    					if (!letterFinishedAnimation)
    						wordLetters[randomLetterIndex] = text[randomLetterIndex];
    					else continue
    				} else {
    					wordLetters[randomLetterIndex] = getRandomLetter();
    				}

    				const scrambledText = wordLetters.join('');
    				currentNode.innerHTML = scrambledText;

    				const finishedScrambling = scrambledText === text;

    				const letterInterval = options.scrambleSlowdown
    					? Math.round(timeEllapsed() / 100)
    					: 1;

    				await sleep(letterInterval);

    				if (finishedScrambling) {
    					resolve();
    					break
    				}
    			}
    		});
    	});
    	options.dispatch('done');
    };

    var scramble = /*#__PURE__*/Object.freeze({
        __proto__: null,
        mode: mode$1
    });

    /** @type {import(types').OnAnimationEnd} */
    const onAnimationEnd = (element, callback) => {
    	const observer = new MutationObserver(mutations => {
    		mutations.forEach(mutation => {
    			const elementAttributeChanged = mutation.type === 'attributes';
    			const elementFinishedTyping = mutation.target.classList.contains('typing');
    			if (elementAttributeChanged && elementFinishedTyping) callback();
    		});
    	});

    	observer.observe(element, {
    		attributes: true,
    		childList: true,
    		subtree: true
    	});
    };

    const cleanChildText = elements =>
    	elements.forEach(element => (element.currentNode.textContent = ''));

    /** @type {import('types').TypewriterOptions} */
    const mode = async (elements, options) => {
    	if (options.cascade) {
    		cleanChildText(elements);
    	} else {
    		const { getLongestTextElement } = await Promise.resolve().then(function () { return getLongestTextElement$1; });
    		const lastElementToFinish = getLongestTextElement(elements);
    		onAnimationEnd(lastElementToFinish, () => options.dispatch('done'));
    	}
    	for (const element of elements) {
    		if (options.cascade) {
    			await writeEffect(element, options);
    			element.currentNode.classList.replace('typing', 'finished-typing');
    		} else {
    			writeEffect(element, options).then(() => {
    				element.currentNode.classList.replace('typing', 'finished-typing');
    			});
    		}
    	}

    	options.cascade && options.dispatch('done');
    };

    var typewriter = /*#__PURE__*/Object.freeze({
        __proto__: null,
        mode: mode
    });

    /** @type {import(types').DescendingSortFunction} */
    const descendingSortFunction = (firstElement, secondElement) =>
    	secondElement.text.length - firstElement.text.length;

    /** @type {import(types').GetLongestTextElement} */
    const getLongestTextElement = elements => {
    	const descendingTextLengthOrder = elements.sort(descendingSortFunction);
    	const longestTextElement = descendingTextLengthOrder[0].currentNode;
    	return longestTextElement
    };

    var getLongestTextElement$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        getLongestTextElement: getLongestTextElement
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
