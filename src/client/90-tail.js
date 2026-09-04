    function apply(ctx) {
      ctx.effect(() => injectStyles(CSS));
      applySettingsCard(ctx);
      ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
        name: "tool.call.toolview",
        key: "render_visual"
      }, Row));
    }

    exports.apply = apply;
    exports.inject = ["slots", "settingsScope"];
    return module.exports;
  }
});
