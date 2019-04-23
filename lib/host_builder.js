"use strict";
/*
 * The MIT License (MIT)
 *
 * Copyright (c) 2019 Looker Data Sciences, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */
Object.defineProperty(exports, "__esModule", { value: true });
var host_1 = require("./host");
/**
 * Provides methods to define the properties of a [[ChattyHost]]
 */
var ChattyHostBuilder = /** @class */ (function () {
    /*
     * @hidden
     */
    function ChattyHostBuilder(_url) {
        this._url = _url;
        this._appendTo = null;
        this._handlers = {};
        this._sandboxAttrs = [];
        this._frameBorder = '0';
        this._targetOrigin = null;
    }
    Object.defineProperty(ChattyHostBuilder.prototype, "el", {
        get: function () {
            return this._appendTo || document.body;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChattyHostBuilder.prototype, "handlers", {
        get: function () {
            return this._handlers;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChattyHostBuilder.prototype, "sandboxAttrs", {
        get: function () {
            return this._sandboxAttrs;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChattyHostBuilder.prototype, "targetOrigin", {
        get: function () {
            return this._targetOrigin;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChattyHostBuilder.prototype, "url", {
        get: function () {
            return this._url;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * @param el the HTML element that the iframe will live inside. The iframe will be created as
     * a direct child of the element.
     */
    ChattyHostBuilder.prototype.appendTo = function (el) {
        this._appendTo = el;
        return this;
    };
    /**
     * Removes an event handler to the host.
     *
     * @param name Event name
     * @param fn Callback function to remove.
     */
    ChattyHostBuilder.prototype.off = function (name, fn) {
        if (this._handlers[name]) {
            this._handlers[name] = this._handlers[name].filter(function (handler) { return handler !== fn; });
        }
    };
    /**
     * Adds an event handler to the host.
     *
     * @param name Event name to which to listen.
     * @param fn Callback function that is invoked when the event
     * is received, and accepts any parameters that were passed with the event.
     */
    ChattyHostBuilder.prototype.on = function (name, fn) {
        this._handlers[name] = this._handlers[name] || [];
        this._handlers[name].push(fn);
        return this;
    };
    ChattyHostBuilder.prototype.getFrameBorder = function () {
        return this._frameBorder;
    };
    ChattyHostBuilder.prototype.frameBorder = function (attr) {
        this._frameBorder = attr;
        return this;
    };
    ChattyHostBuilder.prototype.sandbox = function (attr) {
        this._sandboxAttrs.push(attr);
        return this;
    };
    ChattyHostBuilder.prototype.withTargetOrigin = function (targetOrigin) {
        this._targetOrigin = targetOrigin;
        return this;
    };
    /**
     * Builds a [[ChattyHost]] with the provided properties.
     */
    ChattyHostBuilder.prototype.build = function () {
        return new host_1.ChattyHost(this);
    };
    return ChattyHostBuilder;
}());
exports.ChattyHostBuilder = ChattyHostBuilder;
