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
var client_builder_1 = require("./client_builder");
var host_builder_1 = require("./host_builder");
var client_builder_2 = require("./client_builder");
exports.ChattyClientBuilder = client_builder_2.ChattyClientBuilder;
var host_builder_2 = require("./host_builder");
exports.ChattyHostBuilder = host_builder_2.ChattyHostBuilder;
var client_1 = require("./client");
exports.ChattyClient = client_1.ChattyClient;
var host_1 = require("./host");
exports.ChattyHost = host_1.ChattyHost;
/**
 * @class Chatty
 *
 * Primary interface for chatty. Provides methods for creating the chatty hosts and clients.
 */
var Chatty = /** @class */ (function () {
    function Chatty() {
    }
    /**
     * Creates a [[ChattyHostBuilder]] object. The builder presents a set of methods to configure
     * and construct the host object.
     *   *
     * It is up to the client's webserver to return the correct headers to allow for parent/iframe
     * communication. See
     * [Window.postMessage()](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)
     * for details.
     *
     * @param url The URL of the client iframe to create. The hosted iframe should create a chatty
     * client to communicate with the host.
     */
    Chatty.createHost = function (url) {
        return new host_builder_1.ChattyHostBuilder(url);
    };
    /**
     * Creates a [[ChattyClientBuilder]] object. The builder presents a set of methods to configure
     * and construct the client object.
     */
    Chatty.createClient = function () {
        return new client_builder_1.ChattyClientBuilder();
    };
    return Chatty;
}());
exports.Chatty = Chatty;
