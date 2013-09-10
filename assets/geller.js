/*!
 * geller
 * Simple URI hash handling
 * https://github.com/ile/geller
 *
 * Copyright 2013, Ilkka Huotari
 * Released under the MIT license.
 *
 */


(function(global) {

    /**
     * Define forEach for older js environments
     * @see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/forEach#Compatibility
     */
    if (!Array.prototype.forEach) {
        Array.prototype.forEach = function(fn, scope) {
            for (var i = 0, len = this.length; i < len; ++i) {
                fn.call(scope || this, this[i], i, this);
            }
        };
    }

    /**
     * unescape a query param value
     * @param  {string} s encoded value
     * @return {string}   decoded value
     */
    function decode(s) {
        s = decodeURIComponent(s);
        s = s.replace('+', ' ');
        return s;
    }

    /**
     * Breaks a query string down into an array of key/value pairs
     * @param  {string} str query
     * @return {array}      array of arrays (key/value pairs)
     */
    function parseQuery(str) {
        var i, ps, p, kvp, k, v,
            pairs = {};

        if (str.substring(0, 1) === '#') {
            str = str.substring(1);
        }

        if (typeof(str) === 'undefined' || str === null || str === '') {
            return pairs;
        }

        if (str.indexOf('?') === 0) {
            str = str.substring(1);
        }

        ps = str.toString().split(/[&;]/);

        for (i = 0; i < ps.length; i++) {
            p = ps[i];
            kvp = p.split('=');
            k = kvp[0];
            v = p.indexOf('=') === -1 ? null : (kvp[1] === null ? '' : kvp[1]);
            pairs[decode(k)] = decode(v);
        }
        return pairs;
    }

    /**
     * Creates a new Uri object
     * @constructor
     */
    function Uri() {
        this.queryPairs = parseQuery(window.location.hash);
    }

    /**
     * returns the first query param value found for the key
     * @param  {string} key query key
     * @return {string}     first value found for key
     */
    Uri.prototype.get = function (key) {
        return key? this.queryPairs[key]: this.queryPairs;
    };


    /**
     * returns the first query param value found for the key
     * @param  {string} key query key
     * @return {string}     first value found for key
     */
    Uri.prototype.set = function (obj) {
       if (arguments.length === 1 && typeof obj === 'object') {
            for (var i in obj) {
                this.queryPairs[i] = obj[i];
            }
        }

        window.location.hash = this.toString();
        return this;
    };

    /**
     * removes query parameters
     * @param  {string} key     remove values for key
     * @param  {val}    [val]   remove a specific value, otherwise removes all
     * @return {Uri}            returns self for fluent chaining
     */
    Uri.prototype.delete = function (key) {
        if (key) {
            delete this.queryPairs[key];
        }
        else {
            this.queryPairs = {};
        }

        return this;
    };

    /**
     * Serializes the internal state of the Uri object
     * @return {string}
     */
    Uri.prototype.toString = function() {
        var s = '';

        for (var i in this.queryPairs) {
            if (s.length) {
                s += '&'
            }
            s += encodeURIComponent(i) + '=' + encodeURIComponent(this.queryPairs[i])
        }

        return s;
    }

    /**
     * export via CommonJS, otherwise leak a global
     */
    if (typeof module === 'undefined') {
        global.Uri = Uri;
    } else {
        module.exports = Uri;
    }
}(this));
