export function generateMessage() {
    const currentTime = new Date();
    return {
      message: `Simple cron job ran successfully at ${currentTime.toLocaleString()}`,
      timestamp: currentTime.toISOString(),
    };
  }