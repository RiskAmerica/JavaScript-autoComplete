/*
 JavaScript autoComplete v1.0.3
 Copyright (c) 2014 Simon Steinberger / Pixabay
 GitHub: https://github.com/Pixabay/JavaScript-autoComplete
 License: http://www.opensource.org/licenses/mit-license.php
 */

/* global define */

(function (root, factory) {
    var name = 'autoComplete';
    if (typeof define === 'function' && define.amd) {
        define([], function () {
            return (root[name] = factory());
        });
    } else if (typeof exports === 'object') {
        module.exports = factory();
    } else {
        root[name] = factory();
    }
}(this, function () {

    /* jshint validthis: true */

    "use strict";

    /**
     * @constructor
     * @param {Object} options
     * @returns {autoComplete}
     */
    function autoComplete(options) {
        // Check if requirements are met
        if (!document.querySelector) {
            return;
        }

        this.settings = this.buildSettings(options);
        this.eventHandlers = [];
        this.instances = this.createInstances(this.settings.selector);

        this.addEvent(window, 'resize', this.onResize, null);
    }

    autoComplete.prototype = {
        defaults: {
            selector: 0,
            source: 0,
            minChars: 3,
            delay: 150,
            cache: 1,
            menuClass: '',
            renderItem: function (item, search) {
                // escape special characters
                search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
                var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                return '<div class="autocomplete-suggestion" data-val="' + item + '">' +
                        item.replace(re, "<b>$1</b>") +
                        '</div>';
            },
            onSelect: function (e, term, item) {},
            popupContainer: document.body
        },
        buildSettings: function (options) {
            var settings = {},
                    defaults = this.defaults;
            for (var property in defaults) {
                if (options.hasOwnProperty(property)) {
                    settings[property] = options[property];
                } else {
                    settings[property] = defaults[property];
                }
            }
            return settings;
        },
        createInstances: function (selector) {
            var textFields = typeof selector === 'object' ?
                    [selector] : document.querySelectorAll(selector),
                    instances = [],
                    settings = this.settings;

            for (var i = 0; i < textFields.length; i++) {
                var textField = textFields[i],
                        sc = this.createSuggestionsContainer(),
                        instance = {
                            textField: textField,
                            suggestionsContainer: sc,
                            autocompleteAttr: textField.getAttribute('autocomplete'),
                            cache: {},
                            lastVal: ''
                        },
                eventData = {
                    instance: instance
                };

                this.live('autocomplete-suggestion', 'mouseleave', this.onMouseLeave, sc, eventData);
                this.live('autocomplete-suggestion', 'mouseover', this.onMouseOver, sc, eventData);
                this.live('autocomplete-suggestion', 'mousedown', this.onMouseDown, sc, eventData);
                
                this.addEvent(textField, 'blur', this.onBlur, eventData);
                this.addEvent(textField, 'keydown', this.onKeyDown, eventData);
                this.addEvent(textField, 'keyup', this.onKeyUp, eventData);
                if (!settings.minChars) { 
                    this.addEvent(textField, 'focus', this.onFocus, eventData);
                }

                textField.autoCompleteInstance = instance;
                textField.setAttribute('autocomplete', 'off');

                settings.popupContainer.appendChild(sc);
                instances.push(instance);
            }

            return instances;
        },
        createSuggestionsContainer: function () {
            var container = document.createElement('div');
            container.className = 'autocomplete-suggestions ' + this.settings.menuClass;
            return container;
        },
        getStyle: function (element) {
            return window.getComputedStyle ?
                    getComputedStyle(element, null) : element.currentStyle;
        },
        isVisible: function (instance) {
            var sc = instance.suggestionsContainer;
            return this.getStyle(sc).display === "block";
        },
        hide: function (instance) {
            var sc = instance.suggestionsContainer;
            sc.style.display = 'none';
        },
        updateSuggestionsContainer: function (instance, resize, next) {
            var textField = instance.textField,
                    sc = instance.suggestionsContainer,
                    rect = textField.getBoundingClientRect(),
                    style = sc.style;
            style.left = rect.left + (window.pageXOffset || document.documentElement.scrollLeft) + 'px';
            style.top = rect.bottom + (window.pageYOffset || document.documentElement.scrollTop) + 1 + 'px';
            style.width = rect.right - rect.left + 'px'; // outerWidth
            if (!resize) {
                style.display = 'block';
                if (!sc.maxHeight) {
                    sc.maxHeight = parseInt(this.getStyle(sc).maxHeight);
                }
                if (!sc.suggestionHeight) {
                    sc.suggestionHeight = sc.querySelector('.autocomplete-suggestion').offsetHeight;
                }
                if (sc.suggestionHeight) {
                    if (!next) {
                        sc.scrollTop = 0;
                    } else {
                        var scrTop = sc.scrollTop,
                                selTop = next.getBoundingClientRect().top - sc.getBoundingClientRect().top;
                        if (selTop + sc.suggestionHeight - sc.maxHeight > 0) {
                            sc.scrollTop = selTop + sc.suggestionHeight + scrTop - sc.maxHeight;
                        } else if (selTop < 0) {
                            sc.scrollTop = selTop + scrTop;
                        }
                    }
                }
            }
        },
        suggest: function (instance, term, suggestions) {
            var sc = instance.suggestionsContainer,
                    settings = this.settings;
            if (settings.cache) {
                instance.cache[term] = suggestions;
            }
            if (suggestions.length && term.length >= settings.minChars) {
                var s = '';
                for (var i = 0; i < suggestions.length; i++) {
                    s += settings.renderItem(suggestions[i], term);
                }
                sc.innerHTML = s;
                this.updateSuggestionsContainer(instance, false);
            } else {
                this.hide(instance);
            }
        },
        hasClass: function (el, className) {
            if (el.classList) {
                return el.classList.contains(className);
            } else {
                return new RegExp('\\b' + className + '\\b').test(el.className);
            }
        },
        /**
         * Adds an event listener to the given element that calls the given hander.
         * 
         * @param {Element} el The element.
         * @param {String} type Event type. Can be a space separated list of types.
         * @param {Function} handler The handler function.
         * @param {Object} data Additional that is passed to the handler.
         * @returns {Function} The handler proxy function.
         */
        addEvent: function (el, type, handler, data) {
            var self = this,
                    types = type.split(' '),
                    listener = function (e) {
                        return handler.call(self, this, e, data);
                    };
            for (var i = 0; i < types.length; i++) {
                var _type = types[i];
                if (el.attachEvent) {
                    el.attachEvent('on' + _type, listener);
                } else {
                    el.addEventListener(_type, listener);
                }
            }
            this.eventHandlers.push({
                el: el,
                type: type,
                handler: listener
            });
            return listener;
        },
        /**
         * Removes an event listener.
         * 
         * @param {Element} el The element
         * @param {String} type Event type. Can be a space separated list of types.
         * @param {Function} handler The handler function
         * @returns {undefined}
         */
        removeEvent: function (el, type, handler) {
            var types = type.split(' ');
            for (var i = 0; i < types.length; i++) {
                var _type = types[i];
                if (el.detachEvent) {
                    el.detachEvent('on' + _type, handler);
                } else {
                    el.removeEventListener(_type, handler);
                }
            }
        },
        live: function (elClass, type, cb, context, data) {
            context = context || document;
            var self = this,
                    listener = function (el2, ev) {
                        var found, el = ev.target || ev.srcElement;
                        while (el && !(found = self.hasClass(el, elClass))) {
                            el = el.parentElement;
                        }
                        if (found) {
                            cb.apply(this, [el, ev, data]);
                        }
                    };
            return this.addEvent(context, type, listener, data);
        },
        destroy: function () {
            var instances = this.instances,
                    eventHandlers = this.eventHandlers;

            for (var i = 0; i < eventHandlers.length; i++) {
                var eventHandler = eventHandlers[i];
                this.removeEvent(eventHandler.el, eventHandler.type, eventHandler.handler);
            }

            for (var k = 0; k < instances.length; k++) {
                var instance = instances[k],
                        textField = instance.textField;
                if (instance.autocompleteAttr) {
                    textField.setAttribute('autocomplete', instance.autocompleteAttr);
                } else {
                    textField.removeAttribute('autocomplete');
                }
                instance.suggestionsContainer.parentNode.removeChild(
                        instance.suggestionsContainer);
                delete textField.autoCompleteInstance;
            }
        },
        onResize: function (el, ev, data) {
            var instances = this.instances;
            for (var i = 0; i < instances.length; i++) {
                this.updateSuggestionsContainer(instances[i], true);
            }
        },
        onMouseLeave: function (el, ev, data) {
            var suggestionsContainer = data.instance.suggestionsContainer;
            var selected = suggestionsContainer.querySelector('.autocomplete-suggestion.selected');
            if (selected) {
                setTimeout(function () {
                    selected.className = selected.className.replace(/\s*selected/, '');
                }, 20);
            }
        },
        onMouseOver: function (el, ev, data) {
            var sc = data.instance.suggestionsContainer,
                    selected = sc.querySelector('.autocomplete-suggestion.selected');
            if (selected) {
                selected.className = selected.className.replace(/\s*selected/, '');
            }
            el.className += ' selected';
        },
        onMouseDown: function (el, ev, data) {
            var instance = data.instance,
                    textField = instance.textField;
            if (this.hasClass(el, 'autocomplete-suggestion')) { // else outside click
                var v = el.getAttribute('data-val');
                textField.value = v;
                this.settings.onSelect(ev, v, el);
                this.hide(instance);
            }
        },
        onBlur: function (el, ev, data) {
            var instance = data.instance,
                    sc = instance.suggestionsContainer,
                    overSb = 0,
                    self = this;
            try {
                overSb = document.querySelector('.autocomplete-suggestions:hover');
            } catch (e) {
                // Default value: overSb = 0
            }

            if (!overSb) {
                instance.lastVal = el.value;
                self.hide(instance);
                setTimeout(function () {
                    self.hide(instance);
                }, 350); // hide suggestions on fast input
            } else if (el !== document.activeElement) {
                setTimeout(function () {
                    el.focus();
                }, 20);
            }
        },
        onKeyDown: function (el, ev, data) {
            var key = window.event ? ev.keyCode : ev.which,
                    instance = data.instance,
                    sc = instance.suggestionsContainer,
                    selected,
                    self = this;
            // down (40), up (38)
            if ((key === 40 || key === 38) && sc.innerHTML) {
                var next;
                selected = sc.querySelector('.autocomplete-suggestion.selected');
                if (!selected) {
                    next = (key === 40) ?
                            sc.querySelector('.autocomplete-suggestion') :
                            sc.childNodes[sc.childNodes.length - 1]; // first : last
                    next.className += ' selected';
                    el.value = next.getAttribute('data-val');
                } else {
                    next = (key === 40) ? selected.nextSibling : selected.previousSibling;
                    if (next) {
                        selected.className = selected.className.replace(/\s*selected/, '');
                        next.className += ' selected';
                        el.value = next.getAttribute('data-val');
                    } else {
                        selected.className = selected.className.replace(/\s*selected/, '');
                        el.value = instance.lastVal;
                        next = 0;
                    }
                }
                this.updateSuggestionsContainer(instance, false, next);
                return false;
            } else if (key === 27) { // esc
                el.value = instance.lastVal;
                this.hide(instance);
            } else if (key === 13 || key === 9) { // enter
                selected = sc.querySelector('.autocomplete-suggestion.selected');
                if (selected && this.isVisible(instance)) {
                    this.settings.onSelect(ev, selected.getAttribute('data-val'), selected);
                    setTimeout(function () {
                        self.hide(instance);
                    }, 20);
                }
            }
        },
        onKeyUp: function (el, ev, data) {
            var key = window.event ? ev.keyCode : ev.which,
                    self = this,
                    settings = self.settings,
                    instance = data.instance;
            if (!key || (key < 35 || key > 40) && key !== 13 && key !== 27) {
                var val = instance.textField.value;
                if (val.length >= settings.minChars) {
                    if (val !== instance.lastVal) {
                        instance.lastVal = val;
                        clearTimeout(instance.timer);
                        var suggestProxy = function (suggestions) {
                            self.suggest(instance, val, suggestions);
                        };
                        if (settings.cache) {
                            if (val in instance.cache) {
                                suggestProxy(instance.cache[val]);
                                return;
                            }
                            // no requests if previous suggestions were empty
                            for (var i = 1; i < val.length - settings.minChars; i++) {
                                var part = val.slice(0, val.length - i);
                                if (part in instance.cache && !instance.cache[part].length) {
                                    suggestProxy([]);
                                    return;
                                }
                            }
                        }
                        instance.timer = setTimeout(function () {
                            settings.source(val, suggestProxy);
                        }, settings.delay);
                    }
                } else {
                    instance.lastVal = val;
                    this.hide(instance);
                }
            }
        },
        onFocus: function (el, ev, data) {
            data.instance.lastVal = '\n';
            this.onKeyUp.call(this, el, ev, data);
        }
    };

    return autoComplete;

}));
