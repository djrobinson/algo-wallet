import { createStore, applyMiddleware } from 'redux'
import saga from 'redux-saga'
import rootReducer from '../reducers'

const configureStore = preloadedState => createStore(
  rootReducer,
  preloadedState
)

export default configureStore