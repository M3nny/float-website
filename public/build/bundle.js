
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function append(target, node) {
        target.appendChild(node);
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

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
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
    const outroing = new Set();
    let outros;
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
    const file$1 = "node_modules/svelte-typewriter/src/Typewriter.svelte";

    function create_fragment$1(ctx) {
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
    			add_location(div, file$1, 62, 0, 1150);
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
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
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

    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {
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
    			id: create_fragment$1.name
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

    /* src/App.svelte generated by Svelte v3.44.3 */
    const file = "src/App.svelte";

    // (29:2) <Typewriter interval={150} cursor={false}>
    function create_default_slot(ctx) {
    	let h2;

    	const block = {
    		c: function create() {
    			h2 = element("h2");
    			h2.textContent = "Welcome";
    			attr_dev(h2, "id", "text");
    			add_location(h2, file, 29, 3, 733);
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
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(29:2) <Typewriter interval={150} cursor={false}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
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
    	let div8;
    	let div7;
    	let img3;
    	let img3_src_value;
    	let t4;
    	let div0;
    	let h1;
    	let t6;
    	let h2;
    	let t8;
    	let div4;
    	let div1;
    	let svg0;
    	let path0;
    	let t9;
    	let p0;
    	let t11;
    	let p1;
    	let t12;
    	let br0;
    	let t13;
    	let t14;
    	let div2;
    	let svg1;
    	let path1;
    	let t15;
    	let p2;
    	let t17;
    	let p3;
    	let t18;
    	let br1;
    	let t19;
    	let t20;
    	let div3;
    	let svg2;
    	let path2;
    	let t21;
    	let p4;
    	let t23;
    	let p5;
    	let t24;
    	let br2;
    	let t25;
    	let t26;
    	let div6;
    	let div5;
    	let svg3;
    	let path3;
    	let t27;
    	let p6;
    	let t29;
    	let p7;
    	let t30;
    	let br3;
    	let t31;
    	let current;

    	typewriter = new Typewriter({
    			props: {
    				interval: 150,
    				cursor: false,
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			main = element("main");
    			section = element("section");
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			img2 = element("img");
    			t2 = space();
    			create_component(typewriter.$$.fragment);
    			t3 = space();
    			div8 = element("div");
    			div7 = element("div");
    			img3 = element("img");
    			t4 = space();
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Float";
    			t6 = space();
    			h2 = element("h2");
    			h2.textContent = "music bot for discord";
    			t8 = space();
    			div4 = element("div");
    			div1 = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t9 = space();
    			p0 = element("p");
    			p0.textContent = "Simple and easy";
    			t11 = space();
    			p1 = element("p");
    			t12 = text("Only a few commands ");
    			br0 = element("br");
    			t13 = text(" without any distractions.");
    			t14 = space();
    			div2 = element("div");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t15 = space();
    			p2 = element("p");
    			p2.textContent = "Anti-afk";
    			t17 = space();
    			p3 = element("p");
    			t18 = text("Float leaves the room automatically ");
    			br1 = element("br");
    			t19 = text(" after being inactive for a period of time.");
    			t20 = space();
    			div3 = element("div");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t21 = space();
    			p4 = element("p");
    			p4.textContent = "Music from youtube like no others";
    			t23 = space();
    			p5 = element("p");
    			t24 = text("The music is streamed from youtube ");
    			br2 = element("br");
    			t25 = text(" providing a fast experience.");
    			t26 = space();
    			div6 = element("div");
    			div5 = element("div");
    			svg3 = svg_element("svg");
    			path3 = svg_element("path");
    			t27 = space();
    			p6 = element("p");
    			p6.textContent = "Slash commands";
    			t29 = space();
    			p7 = element("p");
    			t30 = text("Write commands faster ");
    			br3 = element("br");
    			t31 = text(" using the slashed notation.");
    			if (!src_url_equal(img0.src, img0_src_value = "images/background.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "id", "bg");
    			attr_dev(img0, "alt", "background");
    			add_location(img0, file, 24, 2, 412);
    			if (!src_url_equal(img1.src, img1_src_value = "images/floating_island.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "id", "floating_island");
    			attr_dev(img1, "alt", "floating_island");
    			add_location(img1, file, 25, 2, 498);
    			if (!src_url_equal(img2.src, img2_src_value = "images/grass.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "id", "grass");
    			attr_dev(img2, "alt", "grass");
    			add_location(img2, file, 26, 2, 612);
    			add_location(section, file, 23, 1, 400);
    			if (!src_url_equal(img3.src, img3_src_value = "images/bot_icon.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "bi");
    			attr_dev(img3, "class", "mx-auto object-contain h-48 w-96");
    			add_location(img3, file, 35, 3, 876);
    			attr_dev(h1, "class", "text-center");
    			set_style(h1, "font-size", "50px");
    			add_location(h1, file, 38, 2, 972);
    			attr_dev(h2, "class", "text-center");
    			set_style(h2, "font-size", "35px");
    			add_location(h2, file, 39, 2, 1034);
    			add_location(div0, file, 36, 2, 963);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z");
    			add_location(path0, file, 46, 4, 1307);
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "h-6 w-6");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file, 45, 3, 1192);
    			attr_dev(p0, "class", "text-xl");
    			add_location(p0, file, 48, 3, 1443);
    			add_location(br0, file, 49, 26, 1508);
    			add_location(p1, file, 49, 3, 1485);
    			add_location(div1, file, 44, 2, 1183);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636");
    			add_location(path1, file, 54, 4, 1679);
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "h-6 w-6");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file, 53, 3, 1564);
    			attr_dev(p2, "class", "text-xl");
    			add_location(p2, file, 56, 3, 1864);
    			add_location(br1, file, 57, 42, 1938);
    			add_location(p3, file, 57, 3, 1899);
    			add_location(div2, file, 52, 2, 1555);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3");
    			add_location(path2, file, 62, 4, 2126);
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "class", "h-6 w-6");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke", "currentColor");
    			add_location(svg2, file, 61, 3, 2011);
    			attr_dev(p4, "class", "text-xl");
    			add_location(p4, file, 64, 3, 2364);
    			add_location(br2, file, 65, 41, 2462);
    			add_location(p5, file, 65, 3, 2424);
    			add_location(div3, file, 60, 2, 2002);
    			attr_dev(div4, "class", "h-56 grid grid-cols-3 gap-4 content-center");
    			add_location(div4, file, 43, 1, 1124);
    			attr_dev(path3, "stroke-linecap", "round");
    			attr_dev(path3, "stroke-linejoin", "round");
    			attr_dev(path3, "stroke-width", "2");
    			attr_dev(path3, "d", "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z");
    			add_location(path3, file, 72, 4, 2703);
    			attr_dev(svg3, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg3, "class", "h-6 w-6");
    			attr_dev(svg3, "fill", "none");
    			attr_dev(svg3, "viewBox", "0 0 24 24");
    			attr_dev(svg3, "stroke", "currentColor");
    			add_location(svg3, file, 71, 3, 2588);
    			attr_dev(p6, "class", "text-xl");
    			add_location(p6, file, 74, 3, 2898);
    			add_location(br3, file, 75, 28, 2964);
    			add_location(p7, file, 75, 3, 2939);
    			add_location(div5, file, 70, 2, 2579);
    			attr_dev(div6, "class", "h-56 grid grid-cols-2 gap-20 content-center");
    			add_location(div6, file, 69, 1, 2519);
    			add_location(div7, file, 34, 2, 867);
    			attr_dev(div8, "class", "font-9xl flex flex-wrap justify-center my-8");
    			add_location(div8, file, 33, 1, 807);
    			add_location(main, file, 22, 0, 392);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, section);
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
    			append_dev(main, t3);
    			append_dev(main, div8);
    			append_dev(div8, div7);
    			append_dev(div7, img3);
    			append_dev(div7, t4);
    			append_dev(div7, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t6);
    			append_dev(div0, h2);
    			append_dev(div7, t8);
    			append_dev(div7, div4);
    			append_dev(div4, div1);
    			append_dev(div1, svg0);
    			append_dev(svg0, path0);
    			append_dev(div1, t9);
    			append_dev(div1, p0);
    			append_dev(div1, t11);
    			append_dev(div1, p1);
    			append_dev(p1, t12);
    			append_dev(p1, br0);
    			append_dev(p1, t13);
    			append_dev(div4, t14);
    			append_dev(div4, div2);
    			append_dev(div2, svg1);
    			append_dev(svg1, path1);
    			append_dev(div2, t15);
    			append_dev(div2, p2);
    			append_dev(div2, t17);
    			append_dev(div2, p3);
    			append_dev(p3, t18);
    			append_dev(p3, br1);
    			append_dev(p3, t19);
    			append_dev(div4, t20);
    			append_dev(div4, div3);
    			append_dev(div3, svg2);
    			append_dev(svg2, path2);
    			append_dev(div3, t21);
    			append_dev(div3, p4);
    			append_dev(div3, t23);
    			append_dev(div3, p5);
    			append_dev(p5, t24);
    			append_dev(p5, br2);
    			append_dev(p5, t25);
    			append_dev(div7, t26);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, svg3);
    			append_dev(svg3, path3);
    			append_dev(div5, t27);
    			append_dev(div5, p6);
    			append_dev(div5, t29);
    			append_dev(div5, p7);
    			append_dev(p7, t30);
    			append_dev(p7, br3);
    			append_dev(p7, t31);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const typewriter_changes = {};

    			if (dirty & /*$$scope, text*/ 264) {
    				typewriter_changes.$$scope = { dirty, ctx };
    			}

    			typewriter.$set(typewriter_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(typewriter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(typewriter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			/*img0_binding*/ ctx[4](null);
    			/*img1_binding*/ ctx[5](null);
    			/*img2_binding*/ ctx[6](null);
    			destroy_component(typewriter);
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
