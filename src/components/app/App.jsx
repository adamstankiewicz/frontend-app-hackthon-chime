import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import { AppProvider } from '@edx/frontend-platform/react';
import Header from '@edx/frontend-component-header-edx';

import { VideoConversationPage } from '../video-conversation-page';

import './App.scss';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Header />
        <Switch>
          <Route exact path="/join" component={VideoConversationPage} />
        </Switch>
      </Router>
    </AppProvider>
  );
}
