    // ---- 消息流内联卡片：自定义 Chat Node（路线 A） ----
    // 宿主消息流按 conversation.chat.node 槽位以 node.kind 分发渲染器；
    // ChatNodeDataMap 是官方留的可合并注册表。插件经 uiConversation.events.register
    // 注册 ConversationNodeDefinition，把 render_visual 的调用投影成消息流一等行，
    // 摆脱工具调用块的宿主高度限制（ToolRow .bodyScroll max-height:260px）。
    // 参照官方先例：ui-deliverables（turn-deliverables.ts 的 deliverablesDefinition）。
    const VISUALIZER_KIND = "visualizer-card";

    // tool/call 事件的 arguments 是 JSON 字符串；ptc-dispatch 的是对象——统一成字符串。
    function toArgsRaw(value) {
      return typeof value === "string" ? value : JSON.stringify(value);
    }

    function runningBlock(event) {
      const d = event.data;
      return {
        callId: String(d.callId),
        name: "render_visual",
        argsRaw: toArgsRaw(d.arguments),
        subCalls: [],
      };
    }

    function settledBlock(callId, argsRaw, event) {
      const message = event.data.message;
      return {
        kind: "tool-result",
        seq: event.seq,
        time: event.time,
        callId: callId,
        call: { name: "render_visual", argsRaw: argsRaw },
        content: message.content,
        isError: message.isError === true,
        subCalls: [],
      };
    }

    // ptc-dispatch（run_code 子调用）的 settled 形状：data 直接带 content/isError。
    function dispatchSettledBlock(event) {
      const d = event.data;
      return {
        kind: "tool-result",
        seq: event.seq,
        time: event.time,
        callId: String(d.subCallId),
        call: { name: "render_visual", argsRaw: toArgsRaw(d.arguments) },
        content: d.content || [],
        isError: d.isError === true,
        subCalls: [],
      };
    }

    const visualizerDefinition = {
      kind: VISUALIZER_KIND,
      target: "chat",
      match(event) {
        // 根调用：tool/call 带 name 可精确过滤；tool/result 的 source 无 name，
        // 只能全收——未 start 的孤儿 Context state 为 undefined，buildViewNode 返回 null。
        if (event.type === "tool/call") {
          return event.data.name === "render_visual"
            ? { id: String(event.data.callId), role: "start" } : null;
        }
        if (event.type === "tool/result") {
          const source = event.data.message && event.data.message.source;
          return source && source.callId !== undefined
            ? { id: String(source.callId), role: "update" } : null;
        }
        // run_code 内的子调用（web 环境工具经 PTC dispatch 转发）。
        if (event.type === "tool/ptc-dispatch-start" || event.type === "tool/ptc-dispatch") {
          return event.data.name === "render_visual"
            ? { id: String(event.data.subCallId), role: event.type === "tool/ptc-dispatch-start" ? "start" : "update" } : null;
        }
        return null;
      },
      start(_context, match) {
        const event = match.event;
        if (event.type === "tool/ptc-dispatch-start") {
          return { seq: event.seq, block: runningBlock(event), dispatch: true };
        }
        return { seq: event.seq, block: runningBlock(event), dispatch: false };
      },
      update(context, match) {
        const state = context.state;
        const event = match.event;
        if (event.type === "tool/ptc-dispatch") {
          return { seq: state.seq, block: dispatchSettledBlock(event), dispatch: true };
        }
        if (event.type === "tool/result") {
          if (state.dispatch) return state;
          return { seq: state.seq, block: settledBlock(state.block.callId, state.block.argsRaw, event), dispatch: false };
        }
        return state;
      },
      buildViewNode(context) {
        const state = context.state;
        if (state === undefined) return null;
        const anchor = context.matches.length > 0
          ? context.matches[context.matches.length - 1].event.seq
          : 0;
        // location 用 unresolved 而非 start.location：分组器 process-groups.ts 只把
        // 归属某 Turn 的节点塞进过程组折叠，unresolved 节点经 rootEntries 直接独立成行
        // （官方 retry.ts 同款先例）。锚点取最后一次 match 的 seq + 0.1，紧跟工具行、
        // 在最终答案之前——presentationPosition 对非 turn/step location 仍按 anchorSeq 全局排序。
        // 失败调用：不能返回 null（引擎对「已物化后撤回」抛错），改 visibility hidden，
        // 保留 key、由 isVisibleChatNode 过滤，失败状态由工具行 chip 呈现。
        const failed = state.block.kind === "tool-result" && state.block.isError;
        return {
          key: context.key,
          kind: VISUALIZER_KIND,
          id: context.id,
          target: "chat",
          anchorSeq: anchor + 0.1,
          location: { kind: "unresolved" },
          visibility: failed ? "hidden" : "visible",
          data: { block: state.block },
        };
      },
    };

    // 消息流渲染器：node.data.block 平移进现有 Row（同一组件、同一兼容层）。
    function ChatRow(props) {
      return React.createElement(Row, { block: props.node.data.block });
    }

    function applyChatNode(ctx) {
      ctx.effect(() => ctx.uiConversation.events.register(visualizerDefinition));
      ctx.slots.inject("conversation.chat.node", () => ctx.slots.register({
        name: "conversation.chat.node",
        key: VISUALIZER_KIND,
      }, ChatRow));
    }
