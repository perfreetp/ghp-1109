export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/levels/index',
    'pages/level-detail/index',
    'pages/garden/index',
    'pages/backpack/index',
    'pages/mine/index',
    'pages/game/index',
    'pages/tasks/index',
    'pages/leaderboard/index',
    'pages/settings/index',
    'pages/codex/index',
    'pages/orders/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#FF7BA9',
    navigationBarTitleText: '花消消',
    navigationBarTextStyle: 'white',
    backgroundColor: '#FFF5F8'
  },
  tabBar: {
    color: '#B2BEC3',
    selectedColor: '#FF7BA9',
    backgroundColor: '#FFFFFF',
    borderStyle: 'white',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/levels/index',
        text: '关卡'
      },
      {
        pagePath: 'pages/garden/index',
        text: '花园'
      },
      {
        pagePath: 'pages/backpack/index',
        text: '背包'
      },
      {
        pagePath: 'pages/mine/index',
        text: '我的'
      }
    ]
  }
})
