import { AppRegistry } from 'react-native';
import App from './src/App';

const appName = 'MemberManagement';

AppRegistry.registerComponent(appName, () => App);

// For web
if (typeof document !== 'undefined') {
  AppRegistry.runApplication(appName, {
    rootTag: document.getElementById('root'),
  });
}
