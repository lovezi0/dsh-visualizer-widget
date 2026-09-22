    function apply(ctx) {
      ctx.effect(() => injectStyles(CSS));
      ctx.effect(() => applySettingsCard(ctx));
      // 工具调用块：只留一行紧凑状态 chip（宿主对工具块有高度限制）。
      ctx.slots.inject("tool.call.toolview", () => ctx.slots.register({
        name: "tool.call.toolview",
        key: "render_visual"
      }, ChipRow));
      // 完整可视化卡片：作为消息流一等行（自定义 Chat Node），紧跟工具行。
      applyChatNode(ctx);
    }

    exports.apply = apply;
    exports.inject = ["slots", "configForms", "uiConversation"];
    return module.exports;
  }
});
