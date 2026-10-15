import { buildDashboard } from '../utils/dashboardMock';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const dashboardApi = {
  overview: async (params = {}) => {
    await delay(450);
    return { data: buildDashboard(params) };
  },
};

export default dashboardApi;
