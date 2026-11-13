/**
 * 模式 → 注册计划：只表达「理想计划」，**没有生产调用点**（宿主行与代理行各自
 * 用幂等的 sync 逻辑同步路由，见 `src/index.ts` 的 syncModeRoutes 与
 * `src/proxy/index.ts` 的 syncRegistration）。它供测试表达模式语义，改动两处
 * 同步逻辑时不要以它为准。
 */
export function registrationPlan(mode) {
    return mode === 'proxy' ? { acp: false, proxy: true } : { acp: true, proxy: false };
}
export function modeFromFlag(proxyMode) {
    return proxyMode === true ? 'proxy' : 'acp';
}
/** 创建一个进程内总线实现（宿主行与测试共用）。 */
export function createProxyModeBus(read) {
    const listeners = new Set();
    let ready = false;
    // 初值必须来自当前配置：宿主行挂载时按 current() 直接同步路由（不经过
    // notify），代理行缺席时也没人调用 setRouterReady 把 last 推上去。若 last
    // 恒为 false，「加载时就是代理模式」的配置下第一次关闭 proxyMode 会被判成
    // 「没有变化」而吞掉广播，ACP 路由永远不恢复。
    let last = read.mode() === true;
    const notify = () => {
        const next = read.mode() === true;
        if (next === last)
            return;
        last = next;
        for (const listener of [...listeners])
            listener(next);
    };
    return {
        current: () => read.mode() === true,
        requested: () => read.mode() === true,
        routerReady: () => ready,
        setRouterReady(value) { ready = value; notify(); },
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
        proxySettings: () => read.proxySettings(),
        modelSettings: () => read.modelSettings?.() ?? {},
        notify,
    };
}
//# sourceMappingURL=mode-bus.js.map