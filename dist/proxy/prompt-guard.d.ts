/**
 * 上游指纹诊断（**只读**，不改写任何请求内容）。
 *
 * magpie 生态里两个独立实现的实测结论：
 * - `hexiaolv/magpie-antigravity-cloak`：Antigravity 上游按请求文本里的指纹串
 *   拦截，并统一伪装成 `429 Resource has been exhausted`——不是额度问题，
 *   换账号、等额度恢复都无效；关键触发词是 Claude Code 塞进 system 的
 *   `x-anthropic-billing-header` 计费标记行（该公司用零宽空格打散这些词）。
 * - `DylanLIiii/opencode-antigravity-bridge`：把「独立计费伪 header」整行删掉、
 *   把已知 Agent SDK 身份句换成中性句，并明确「通用 429 不再被当作确定配额
 *   耗尽」。
 * - `yetone/magpie` 本体（`internal/gateway/billing_line.go`）的口径不同：它只在
 *   「Anthropic Messages API 上的 Claude 模型」保留计费行，对 **Code Assist /
 *   Antigravity 照旧发送**，去掉该行是为了别的厂家的前缀缓存命中率。
 *
 * 两派做法互斥，本包不选边：**默认只诊断**，把命中的规则 id 与次数交给宿主日志，
 * 让「恒定 429」有据可查；只有显式打开 `cloakSensitiveWords` 时才改写 system
 * （见 {@link cloakUpstreamFingerprints}，属绕过上游识别，默认关闭，风险自负）。
 * DSH 自身的 system 不含这些词（已在本机宿主包里核对），命中通常意味着用户自定义
 * 指令里出现了它们。边界说明见 `docs/configuration.md` 的代理模式一节。
 */
/** 已知会被上游识别为「非官方客户端」的指纹词表（口径取自上面两份实现）。 */
export declare const UPSTREAM_FINGERPRINTS: readonly {
    ruleId: string;
    phrase: string;
}[];
export interface FingerprintHit {
    /** 命中的规则 id；不含命中的原文，日志里也不回显正文。 */
    readonly ruleId: string;
    readonly count: number;
}
/**
 * 大小写不敏感地统计文本里出现的已知指纹。
 *
 * @param text 待扫描文本（通常是本轮 system）；undefined / 空串返回空数组。
 * @returns 命中的规则与次数；顺序与 {@link UPSTREAM_FINGERPRINTS} 一致。
 */
export declare function scanUpstreamFingerprints(text: string | undefined): FingerprintHit[];
/** 把命中结果压成一行日志片段（只有规则 id 与次数）。 */
export declare function describeFingerprintHits(hits: readonly FingerprintHit[]): string;
/**
 * magpie 实测会被 Antigravity 拒绝的整段文本（其 `googleTurnsAway` 词表：
 * 一条条真实账号上试过——原样写、任意大小写都被拒，**首字符后插入零宽空格
 * 后通过**）。与上面的诊断词表分开：诊断表更宽（含社区中间件的词），
 * 这张表只放有实测依据的。
 */
export declare const CLOAK_PHRASES: readonly {
    ruleId: string;
    phrase: string;
}[];
/** 零宽空格：人眼不可见、去零宽即还原原文（magpie 与社区中间件同一手法）。 */
export declare const ZERO_WIDTH_SPACE = "\u200B";
/**
 * 把已知会被上游拒绝的身份文本打散（大小写不敏感，命中区间内逐段插入零宽空格）。
 *
 * 只作用于 system 指令，不动用户消息；返回命中规则用于日志。是否启用由配置决定
 * （默认关闭）：这属于绕过上游识别，写进 `docs/reference.md` 的代理模式边界里。
 */
export declare function cloakUpstreamFingerprints(text: string | undefined): {
    text: string;
    hits: FingerprintHit[];
};
