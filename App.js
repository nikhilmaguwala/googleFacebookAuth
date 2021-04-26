import React, {useState, useEffect} from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import {WEB_CLIENT_ID} from './key';
import {
  LoginButton,
  AccessToken,
  GraphRequest,
  GraphRequestManager,
} from 'react-native-fbsdk';

const App = () => {
  const [googleUserInfo, setGoogleUserInfo] = useState(null);
  const [fbUserInfo, setFbUserInfo] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFacebook, setIsFacebook] = useState(false);
  const [isGoogle, setIsGoogle] = useState(false);

  useEffect(() => {
    configureGoogleSign();
  }, []);

  function configureGoogleSign() {
    GoogleSignin.configure({
      webClientId: WEB_CLIENT_ID,
      offlineAccess: false,
    });
  }

  const getInfoFromToken = token => {
    setIsFacebook(true);
    const PROFILE_REQUEST_PARAMS = {
      fields: {
        string: 'id, name,  first_name, last_name',
      },
    };
    const profileRequest = new GraphRequest(
      '/me',
      {token, parameters: PROFILE_REQUEST_PARAMS},
      (err, result) => {
        if (err) {
          console.log('login info has error: ' + err);
        } else {
          setFbUserInfo(result);
          console.log('result:', result);
        }
      },
    );
    new GraphRequestManager().addRequest(profileRequest).start();
  };

  async function signIn() {
    setIsLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const user = await GoogleSignin.signIn();
      setGoogleUserInfo(user);
      setIsGoogle(true);
      console.log(user);
      setError(null);
      setIsLoggedIn(true);
      setIsLoading(false);
    } catch (err) {
      if (err.code === statusCodes.SIGN_IN_CANCELLED) {
        // when user cancels sign in process,
        Alert.alert('Process Cancelled');
        setIsLoading(false);
      } else if (err.code === statusCodes.IN_PROGRESS) {
        // when in progress already
        Alert.alert('Process in progress');
        setIsLoading(false);
      } else if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // when play services not available
        Alert.alert('Play services are not available');
        setIsLoading(false);
      } else {
        // some other error
        Alert.alert('Something else went wrong... ', err.toString());
        setIsLoading(false);
        setError(err);
      }
    }
  }

  async function signOut() {
    setIsLoading(true);
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setIsLoggedIn(false);
      setGoogleUserInfo(null);
      setIsGoogle(false);
      setIsLoading(false);
    } catch (err) {
      Alert.alert('Something else went wrong... ', err.toString());
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="black" />
      </View>
    );
  }

  const getGoogleLogin = () => {
    if (!isFacebook) {
      if (googleUserInfo === null) {
        return (
          <View style={{marginBottom: 20}}>
            <GoogleSigninButton
              style={styles.signInButton}
              size={GoogleSigninButton.Size.Wide}
              color={GoogleSigninButton.Color.Dark}
              onPress={signIn}
            />
          </View>
        );
      } else {
        return (
          <View style={{alignItems: 'center', justifyContent: 'center'}}>
            <Text style={{fontWeight: 'bold', fontSize: 20, marginBottom: 20}}>
              Logged in using Google
            </Text>
            <Image
              style={styles.logo}
              source={{
                uri: googleUserInfo.user.photo,
              }}
            />
            <Text style={{fontWeight: 'bold', fontSize: 20, marginTop: 20}}>
              Hello, {}
            </Text>
            <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
              <Text style={{fontWeight: 'bold', fontSize: 20, color: 'white'}}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        );
      }
    } else {
      return <View />;
    }
  };

  const getFacebookLogin = () => {
    if (!isGoogle) {
      return (
        <>
          {fbUserInfo && (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
              }}>
              <Text
                style={{fontWeight: 'bold', fontSize: 20, marginBottom: 20}}>
                Logged in using Facebook
              </Text>
              <Image
                style={styles.logo}
                source={{
                  uri: `http://graph.facebook.com/${fbUserInfo.id}/picture?type=large`,
                }}
              />
              <Text style={{fontWeight: 'bold', fontSize: 20, marginTop: 20}}>
                Hello, {fbUserInfo.name}
              </Text>
            </View>
          )}
          <LoginButton
            onLoginFinished={(err, result) => {
              if (err) {
                console.log('login has error: ' + result.error);
              } else if (result.isCancelled) {
                console.log('login is cancelled.');
              } else {
                AccessToken.getCurrentAccessToken().then(data => {
                  const accessToken = data.accessToken.toString();
                  getInfoFromToken(accessToken);
                });
              }
            }}
            onLogoutFinished={() => {
              setFbUserInfo(null);
              setIsFacebook(false);
            }}
          />
        </>
      );
    } else {
      return <View />;
    }
  };

  return (
    <View style={styles.container}>
      {getGoogleLogin()}
      {getFacebookLogin()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  signInButton: {
    width: 200,
    height: 50,
  },
  logo: {
    width: 200,
    height: 200,
  },
  signOutBtn: {
    width: 250,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'red',
    marginTop: 20,
    borderRadius: 20,
  },
});

export default App;
