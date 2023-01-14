function getConvoToSummarize(conversation: string[], _summarizedConvoIndex: number, lastConvoMemory: number) {
  const startIndex = _summarizedConvoIndex - conversation.length - 1;
  return conversation.slice(startIndex, -lastConvoMemory);
}

function getUnsummarizedConvo(conversation: string[], _summarizedConvoIndex: number) {
  const startIndex = _summarizedConvoIndex - conversation.length - 1;
  return conversation.slice(startIndex);
}

export {
  getConvoToSummarize,
  getUnsummarizedConvo,
}