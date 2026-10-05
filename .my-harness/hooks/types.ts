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
  hook_event_name?: 'SessionStart' | 'PreToolUse' | 'PostToolUse' | 'Stop';
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

export interface HookOutput {
  /** 사용자에게 보여줄 메시지 */
  systemMessage?: string;
  hookSpecificOutput?: PreToolUseOutput | SessionStartOutput;
}
