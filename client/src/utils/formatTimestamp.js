export const formatTimestamp = (timestamp) => {
  const now = new Date();
  const messageTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - messageTime) / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  // Just now (< 1 minute)
  if (diffInSeconds < 60) {
    return 'Just now';
  }

  // Minutes ago (< 1 hour)
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
  }

  // Today - show time only
  const isToday = messageTime.toDateString() === now.toDateString();
  if (isToday) {
    return messageTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = messageTime.toDateString() === yesterday.toDateString();
  if (isYesterday) {
    return `Yesterday ${messageTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}`;
  }

  // This week (< 7 days) - show day name
  if (diffInDays < 7) {
    const dayName = messageTime.toLocaleDateString('en-US', { weekday: 'short' });
    const time = messageTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    return `${dayName} ${time}`;
  }

  // Older - show date and time
  const date = messageTime.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
  const time = messageTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  
  return `${date}, ${time}`;
};


export const formatFullTimestamp = (timestamp) => {
  const messageTime = new Date(timestamp);
  
  return messageTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
};












