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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_messages_1 = require("./client_messages");
var host_messages_1 = require("./host_messages");
require("es6-promise/auto"); // Polyfill only browsers without Promises
var debugLib = require("debug");
/**
 * @private
 * Client connection status
 */
var ChattyClientStates;
(function (ChattyClientStates) {
    ChattyClientStates[ChattyClientStates["Connecting"] = 0] = "Connecting";
    ChattyClientStates[ChattyClientStates["Syn"] = 1] = "Syn";
    ChattyClientStates[ChattyClientStates["Connected"] = 2] = "Connected";
})(ChattyClientStates = exports.ChattyClientStates || (exports.ChattyClientStates = {}));
/**
 * The client object for an iframe. The user should not create this object directly, it
 * is returned by the `ChattyClientBuilder.build()` method.
 */
var ChattyClient = /** @class */ (function () {
    /**
     * @param builder The client builder that is responsible for constructing this object.
     * @hidden
     */
    function ChattyClient(builder) {
        this._clientWindow = window;
        this._connection = null;
        this._hostWindow = this._clientWindow.parent;
        this._state = ChattyClientStates.Connecting;
        this._handlers = builder.handlers;
        this._targetOrigin = builder.targetOrigin;
        this._channel = new MessageChannel();
    }
    Object.defineProperty(ChattyClient.prototype, "connection", {
        /**
         * @returns a Promise to an object that resolves when the host has acknowledged the connection.
         */
        get: function () {
            return this._connection;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(ChattyClient.prototype, "isConnected", {
        /**
         * @returns a flag indicating whether the client has successfully connected to the host.
         */
        get: function () {
            return this._state === ChattyClientStates.Connected;
        },
        enumerable: true,
        configurable: true
    });
    /**
     * Connects to the host window.
     * @returns a Promise to an object that resolves when the host has acknowledged the connection. The
     * object contains a `send(message, data)` method that can be used to talk to the host.
     */
    ChattyClient.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this._connection)
                    return [2 /*return*/, this._connection];
                this._connection = new Promise(function (resolve, reject) {
                    _this._channel.port1.onmessage = function (evt) {
                        ChattyClient._debug('received', evt.data.action, evt.data.data);
                        switch (evt.data.action) {
                            case host_messages_1.ChattyHostMessages.SynAck:
                                _this._state = ChattyClientStates.Connected;
                                _this.sendMsg(client_messages_1.ChattyClientMessages.Ack);
                                resolve({
                                    send: function (eventName) {
                                        var payload = [];
                                        for (var _i = 1; _i < arguments.length; _i++) {
                                            payload[_i - 1] = arguments[_i];
                                        }
                                        _this.sendMsg(client_messages_1.ChattyClientMessages.Message, { eventName: eventName, payload: payload });
                                    }
                                });
                                break;
                            case host_messages_1.ChattyHostMessages.Message:
                                if (_this._handlers[evt.data.data.eventName]) {
                                    _this._handlers[evt.data.data.eventName].forEach(function (fn) { return fn.apply(_this, evt.data.data.payload); });
                                }
                                break;
                        }
                    };
                    _this.initiateHandshake();
                });
                return [2 /*return*/, this._connection];
            });
        });
    };
    ChattyClient.prototype.initiateHandshake = function () {
        ChattyClient._debug('connecting to', this._targetOrigin);
        this._hostWindow.postMessage({
            action: client_messages_1.ChattyClientMessages.Syn
        }, this._targetOrigin, [this._channel.port2]);
        this._state = ChattyClientStates.Syn;
    };
    ChattyClient.prototype.sendMsg = function (action, data) {
        if (data === void 0) { data = {}; }
        ChattyClient._debug('sending', action, data);
        this._channel.port1.postMessage({
            action: action,
            data: data
        });
    };
    ChattyClient._debug = debugLib('looker:chatty:client');
    return ChattyClient;
}());
exports.ChattyClient = ChattyClient;
