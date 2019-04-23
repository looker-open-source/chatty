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
var client_1 = require("./client");
/**
 * Provides methods to defined the properties of a [[ChattyClient]]
 */
var ChattyClientBuilder = /** @class */ (function () {
    function ChattyClientBuilder() {
        this._targetOrigin = '*';
        this._handlers = {};
    }
    Object.defineProperty(ChattyClientBuilder.prototype, "targetOrigin", {
        get: function () {
            return this._targetOrigin;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChattyClientBuilder.prototype, "handlers", {
        get: function () {
            return this._handlers;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Removes an event handler to the client.
     *
     * @param name Event name
     * @param fn Callback function to remove
     * @returns the client builder
     */
    ChattyClientBuilder.prototype.off = function (name, fn) {
        if (this._handlers[name]) {
            this._handlers[name] = this._handlers[name].filter(function (handler) { return handler !== fn; });
        }
    };
    /**
     * Adds an event handler to the client.
     *
     * @param name Event name to which to listen.
     * @param fn Callback function that is invoked when the event
     * is received, and accepts any parameters that were passed with the event.
     * @returns the client builder
     */
    ChattyClientBuilder.prototype.on = function (name, fn) {
        this._handlers[name] = this._handlers[name] || [];
        this._handlers[name].push(fn);
        return this;
    };
    /**
     * Optional. Sets the target origin parameter used to communicate with the host. Default
     * is '*'. If possible it should be set the the host window's origin.
     *
     * @param targetOrigin targetOrigin to use with postMessage()
     * @returns the client builder
     */
    ChattyClientBuilder.prototype.withTargetOrigin = function (targetOrigin) {
        this._targetOrigin = targetOrigin;
        return this;
    };
    /**
     * Builds a [[ChattyClient]] with the provided properties.
     * @returns a new Chatty client.
     */
    ChattyClientBuilder.prototype.build = function () {
        return new client_1.ChattyClient(this);
    };
    return ChattyClientBuilder;
}());
exports.ChattyClientBuilder = ChattyClientBuilder;
