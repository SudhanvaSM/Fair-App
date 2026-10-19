// Pings the backend so it doesn't go to sleep

export default {
  async scheduled(controller, env, ctx) {
    try {
      const response = await fetch(env.FAIR_HEALTH_URL, {
        method: "GET",
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        console.error(
          `FAIR backend returned HTTP ${response.status}`
        );
        return;
      }

      console.log("FAIR backend is healthy");
    } catch (error) {
      console.error("FAIR backend health check failed:", error);
    }
  },
};