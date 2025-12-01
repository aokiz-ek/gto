export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/analyzer/index',
    'pages/practice/index',
    'pages/profile/index',
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#0a0a0f',
    navigationBarTitleText: 'Aokiz GTO',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0a0a0f',
  },
  tabBar: {
    color: '#6b6b7b',
    selectedColor: '#00f5d4',
    backgroundColor: '#12121a',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: 'Ranges',
        iconPath: 'assets/icons/ranges.png',
        selectedIconPath: 'assets/icons/ranges-active.png',
      },
      {
        pagePath: 'pages/analyzer/index',
        text: 'Analyzer',
        iconPath: 'assets/icons/analyzer.png',
        selectedIconPath: 'assets/icons/analyzer-active.png',
      },
      {
        pagePath: 'pages/practice/index',
        text: 'Practice',
        iconPath: 'assets/icons/practice.png',
        selectedIconPath: 'assets/icons/practice-active.png',
      },
      {
        pagePath: 'pages/profile/index',
        text: 'Profile',
        iconPath: 'assets/icons/profile.png',
        selectedIconPath: 'assets/icons/profile-active.png',
      },
    ],
  },
});
