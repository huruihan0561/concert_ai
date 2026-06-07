import React, { useState, useEffect, useRef } from 'react';
import { Brain, ChevronDown, ChevronRight, Loader2, CheckCircle2, XCircle, Zap, Terminal } from 'lucide-react';

/**
 * Agent 思考过程可视化面板
 * 展示 ReAct 推理链路：思考 -> 工具调用 -> 工具结果 -> 最终回答
 */
const AgentThinkingPanel = ({ sessionId, visible, onClose }) => {
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedSteps, setExpandedSteps] = useState({});
  const pollingRef = useRef(null);
  const prevLengthRef = useRef(0);

  // 轮询推理链路
  useEffect(() => {
    if (!sessionId || !visible) {
      clearInterval(pollingRef.current);
      return;
    }

    const fetchTrace = async () => {
      try {
        const res = await fetch(`/concert/api/agent/trace/${sessionId}`);
        const json = await res.json();
        if (json.code === 200 && json.data) {
          setSteps(json.data);
          // 新步骤出现时自动展开
          if (json.data.length > prevLengthRef.current) {
            const latest = json.data[json.data.length - 1];
            setExpandedSteps(prev => ({ ...prev, [json.data.length - 1]: true }));
            prevLengthRef.current = json.data.length;
          }
          // 最后一步是 final 且不是 active，说明推理结束
          const lastStep = json.data[json.data.length - 1];
          if (lastStep && lastStep.type === 'final' && !lastStep.active) {
            clearInterval(pollingRef.current);
            setLoading(false);
          }
        }
      } catch (e) {
        console.error('获取推理链路失败', e);
      }
    };

    setLoading(true);
    prevLengthRef.current = 0;
    fetchTrace();
    pollingRef.current = setInterval(fetchTrace, 1200);

    return () => clearInterval(pollingRef.current);
  }, [sessionId, visible]);

  if (!visible) return null;

  const toggleExpand = (idx) => {
    setExpandedSteps(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const getStepIcon = (step, idx) => {
    if (step.type === 'thought') return <Zap className="w-3.5 h-3.5 text-yellow-400" />;
    if (step.type === 'tool_call') return <Terminal className="w-3.5 h-3.5 text-cyan-400" />;
    if (step.type === 'tool_result') return <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />;
    if (step.type === 'final') return <CheckCircle2 className="w-3.5 h-3.5 text-neon-blue" />;
    if (step.type === 'error') return <XCircle className="w-3.5 h-3.5 text-red-400" />;
    return null;
  };

  const getStepLabel = (step) => {
    const labels = {
      thought: '思考',
      tool_call: '工具调用',
      tool_result: '工具结果',
      final: '最终回答',
      error: '异常',
    };
    return labels[step.type] || step.type;
  };

  const getStepColor = (step) => {
    const colors = {
      thought: 'border-l-yellow-400/50 bg-yellow-400/5',
      tool_call: 'border-l-cyan-400/50 bg-cyan-400/5',
      tool_result: 'border-l-green-400/50 bg-green-400/5',
      final: 'border-l-neon-blue/50 bg-neon-blue/5',
      error: 'border-l-red-400/50 bg-red-400/5',
    };
    return colors[step.type] || 'border-l-gray-500/50';
  };

  // 工具名称中文映射
  const toolNameMap = {
    getAllSingers: '歌手列表',
    getAllConcerts: '演唱会列表',
    getSingerConcerts: '歌手演唱会',
    getConcertDetail: '演唱会详情',
    searchMeituanFood: '美团美食',
    searchMeituanHotel: '美团酒店',
    searchMeituanTickets: '美团门票',
    estimateMeituanRide: '美团打车',
    createMeituanReminder: '美团提醒',
    getWeather: '天气预报',
    searchTrains: '火车票查询',
    getSingerPlaylist: '歌手歌单',
    getSeatInfo: '座位信息',
  };

  const formatToolName = (name) => toolNameMap[name] || name || '未知工具';

  // 简化参数字符串用于显示
  const formatArgs = (argsStr) => {
    if (!argsStr || argsStr === '{}') return '';
    try {
      const obj = JSON.parse(argsStr);
      return Object.entries(obj)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `${k}=${typeof v === 'string' ? v : JSON.stringify(v)}`)
        .join(', ');
    } catch {
      return argsStr;
    }
  };

  // 简化结果文本用于显示
  const formatResult = (result) => {
    if (!result) return '';
    return result.length > 300 ? result.substring(0, 300) + '...' : result;
  };

  return (
    <div className="fixed bottom-4 right-4 w-[440px] max-h-[520px] bg-[#0d0f1a] border border-white/10 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
         style={{ fontFamily: "'Inter', 'PingFang SC', sans-serif" }}>
      {/* 头部 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-neon-blue/10 to-neon-purple/10">
        <div className="flex items-center space-x-2">
          <Brain className="w-4 h-4 text-neon-blue animate-pulse" />
          <span className="text-sm font-semibold text-white">AI 推理链路</span>
          {loading && <Loader2 className="w-3.5 h-3.5 text-neon-blue animate-spin" />}
          {!loading && steps.length > 0 && steps[steps.length - 1]?.type === 'final' && (
            <span className="text-xs text-green-400 ml-1">已完成</span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white transition-colors text-xs px-2 py-1 rounded-md hover:bg-white/10"
        >
          收起
        </button>
      </div>

      {/* 推理步骤列表 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ scrollbarWidth: 'thin' }}>
        {steps.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-gray-500">
            <Brain className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs">等待推理开始...</p>
          </div>
        )}

        {steps.map((step, idx) => {
          const isExpanded = expandedSteps[idx];
          const hasDetail = (step.type === 'tool_call' && step.toolArgs) ||
                            (step.type === 'tool_result' && step.toolResult) ||
                            (step.type === 'thought' && step.rawText) ||
                            (step.type === 'final' && step.rawText);

          return (
            <div key={idx} className={`rounded-xl border-l-2 ${getStepColor(step)} transition-all duration-300 ${step.active ? 'ring-1 ring-neon-blue/20' : ''}`}>
              {/* 步骤标题行 */}
              <div
                className="flex items-center space-x-2 px-3 py-2 cursor-pointer"
                onClick={() => hasDetail && toggleExpand(idx)}
              >
                {/* 展开/收起图标 */}
                {hasDetail ? (
                  isExpanded
                    ? <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
                    : <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
                ) : (
                  <div className="w-3" />
                )}

                {/* 步骤图标 */}
                {getStepIcon(step, idx)}

                {/* 步骤标签 */}
                <span className="text-xs font-medium text-gray-300 flex-shrink-0">
                  第{step.step}轮
                </span>

                <span className={`text-xs font-semibold ${
                  step.type === 'thought' ? 'text-yellow-400' :
                  step.type === 'tool_call' ? 'text-cyan-400' :
                  step.type === 'tool_result' ? 'text-green-400' :
                  step.type === 'final' ? 'text-neon-blue' : 'text-red-400'
                }`}>
                  {getStepLabel(step)}
                </span>

                {/* 工具名称 */}
                {step.toolName && (
                  <span className="text-xs text-gray-400 truncate max-w-[140px]">
                    {formatToolName(step.toolName)}
                  </span>
                )}

                {/* 活跃状态指示 */}
                {step.active && (
                  <div className="ml-auto flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-neon-blue animate-pulse" />
                    <span className="text-[10px] text-neon-blue">进行中</span>
                  </div>
                )}

                {/* 收起时的摘要 */}
                {!isExpanded && step.type === 'tool_call' && step.toolArgs && (
                  <span className="ml-auto text-[10px] text-gray-500 truncate max-w-[100px]">
                    {formatArgs(step.toolArgs)}
                  </span>
                )}
                {!isExpanded && step.type === 'tool_result' && step.toolResult && (
                  <span className="ml-auto text-[10px] text-gray-500 truncate max-w-[100px]">
                    {formatResult(step.toolResult)}
                  </span>
                )}
                {!isExpanded && step.type === 'final' && step.rawText && (
                  <span className="ml-auto text-[10px] text-gray-500 truncate max-w-[100px]">
                    {step.rawText.substring(0, 40)}...
                  </span>
                )}
              </div>

              {/* 展开详情 */}
              {isExpanded && hasDetail && (
                <div className="px-3 pb-3 pl-8 space-y-2">
                  {/* 工具参数 */}
                  {step.type === 'tool_call' && step.toolArgs && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">参数</p>
                      <div className="bg-black/30 rounded-lg px-3 py-2 text-[11px] text-cyan-300 font-mono leading-relaxed">
                        {formatArgs(step.toolArgs) || '无参数'}
                      </div>
                    </div>
                  )}

                  {/* 思考原文 */}
                  {step.type === 'thought' && step.rawText && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">思考内容</p>
                      <div className="bg-yellow-400/5 border border-yellow-400/10 rounded-lg px-3 py-2 text-[11px] text-yellow-200/80 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {step.rawText}
                      </div>
                    </div>
                  )}

                  {/* 工具结果 */}
                  {step.type === 'tool_result' && step.toolResult && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">执行结果</p>
                      <div className="bg-green-400/5 border border-green-400/10 rounded-lg px-3 py-2 text-[11px] text-green-200/80 leading-relaxed whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {formatResult(step.toolResult)}
                      </div>
                    </div>
                  )}

                  {/* 最终回答 */}
                  {step.type === 'final' && step.rawText && (
                    <div>
                      <p className="text-[10px] text-gray-500 mb-1 uppercase tracking-wider">最终回答</p>
                      <div className="bg-neon-blue/5 border border-neon-blue/10 rounded-lg px-3 py-2 text-[11px] text-blue-200/80 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                        {step.rawText}
                      </div>
                    </div>
                  )}

                  {/* 异常信息 */}
                  {step.type === 'error' && step.rawText && (
                    <div className="bg-red-400/5 border border-red-400/10 rounded-lg px-3 py-2 text-[11px] text-red-300">
                      {step.rawText}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部统计 */}
      {steps.length > 0 && (
        <div className="px-4 py-2 border-t border-white/10 bg-black/20 flex items-center justify-between">
          <div className="flex items-center space-x-3 text-[10px] text-gray-500">
            <span>总步骤: <span className="text-gray-300">{steps.length}</span></span>
            {(() => {
              const toolCalls = steps.filter(s => s.type === 'tool_call').length;
              return <span>工具调用: <span className="text-cyan-400">{toolCalls}</span></span>;
            })()}
          </div>
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-neon-blue animate-pulse' : 'bg-green-400'}`} />
            <span className="text-[10px] text-gray-500">
              {loading ? '推理中...' : '推理完成'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentThinkingPanel;
