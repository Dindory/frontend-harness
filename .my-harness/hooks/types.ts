// Claude Code 훅 입출력 타입 (이 하네스가 쓰는 필드만)

export interface ToolInput {
  file_path?: string;
  path?: string;
  notebook_path?: string;
  command?: string;
}

export interface HookInput {
  session_id?: string;
  cwd?: string;
  hook_event_name?: 'SessionStart' | 'UserPromptSubmit' | 'PreToolUse' | 'PostToolUse' | 'Stop';
  prompt?: string;
  stop_hook_active?: boolean;
  /** 도구 실행 결과 (형태는 도구마다 달라 문자열로 직렬화해서 본다) */
  tool_response?: unknown;
  tool_name?: string;
  tool_input?: ToolInput;
}

export interface PreToolUseOutput {
  hookEventName: 'PreToolUse';
  permissionDecision: 'allow' | 'deny' | 'ask';
  permissionDecisionReason?: string;
}

export interface SessionStartOutput {
  hookEventName: 'SessionStart';
  additionalContext: string;
}

export interface UserPromptSubmitOutput {
  hookEventName: 'UserPromptSubmit';
  additionalContext: string;
}

export interface HookOutput {
  /** Stop 훅에서 'block' 이면 Claude 가 reason 을 받고 턴을 이어간다 */
  decision?: 'block';
  reason?: string;
  /** 사용자에게 보여줄 메시지 */
  systemMessage?: string;
  hookSpecificOutput?: PreToolUseOutput | SessionStartOutput | UserPromptSubmitOutput;
}
