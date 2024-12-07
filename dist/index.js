"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
var _routeUtils = require("./route.utils.js");
Object.keys(_routeUtils).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (key in exports && exports[key] === _routeUtils[key]) return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _routeUtils[key];
    }
  });
});