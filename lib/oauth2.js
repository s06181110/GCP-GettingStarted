'use strict';

const express = require('express');
const config = require('../config');

// [START setup]
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const TwitterStrategy = require('passport-twitter').Strategy;

function extractProfile(profile) {
    let imageUrl = '';
    if (profile.photos && profile.photos.length) {
        imageUrl = profile.photos[0].value;
    }

    return {
        id: profile.id,
        displayName: profile.displayName,
        image: imageUrl
    };
}

// Configure the Google strategy for use by Passport.js
//
// OAuth 2ベースの戦略には、ユーザーのプロファイルとともにユーザーに代わって
// Google APIにアクセスするための資格情報（ `accessToken`）を受け取る` verify`関数が必要です。
// この関数は、認証後にルートハンドラーの「req.user」で設定されるユーザーオブジェクトで
// 「cb」を呼び出す必要があります。
passport.use(
    new GoogleStrategy(
        {
            clientID: config.get('OAUTH2_CLIENT_ID'),
            clientSecret: config.get('OAUTH2_CLIENT_SECRET'),
            callbackURL: config.get('OAUTH2_CALLBACK'),
            accessType: 'offline',
            userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
        },
        (accessToken, refreshToken, profile, cb) => {
            //Googleが提供するプロファイルオブジェクトから必要な最小限のプロファイル情報を抽出する.
            cb(null, extractProfile(profile));
        }
    )
);

passport.use(
    new TwitterStrategy(
        {
            consumerKey: config.get('TWITTER_CONSUMER_KEY'),
            consumerSecret: config.get('TWITTER_CONSUMER_SECRET'),
            callbackURL: config.get('TWITTER_CALLBACK'),
        },
        (token, tokenSecret, profile, cb) => {
            cb(null, extractProfile(profile));
        }
    )
)

passport.serializeUser((user, cb) => {
    cb(null, user);
});
passport.deserializeUser((obj, cb) => {
   cb(null, obj);
});
// [END setup]

const router = express.Router();

// [START middleware]
// ユーザーのログインを必要とするミドルウェア。
// ユーザーがログインしていない場合、ユーザーをリダイレクトしてアプリケーションを認証し、
// 要求した元のURLに戻します。
function authRequired(req, res, next) {
    if(!req.user) {
        req.session.oauth2return = req.originalUrl;
        return res.redirect('/auth/login');
    }
    next();
}

// ユーザーのプロファイルと任意のテンプレートへのログイン/ログアウトURLを公開するミドルウェア。
// これらは、「profile」、「login」、「logout」として使用できます。
function addTemplateVariables(req, res, next) {
    res.locals.profile = req.user;
    res.locals.login = `/auth/login?return=${encodeURIComponent(
        req.originalUrl
    )}`;
    res.locals.logout = `/auth/logout?return=${encodeURIComponent(
        req.originalUrl
    )}`;
    next();
}
//

// 認証フローを開始します。 ユーザーはGoogleにリダイレクトされ、
// そこで基本的なプロファイル情報へのアクセスをアプリケーションに許可できます。
// 承認されると、ユーザーは `/ auth / google / callback`にリダイレクトされます。
// ユーザーをこのURLに送信するときに「return」クエリパラメーターが指定されている場合、
// フローが終了するとユーザーはそのURLにリダイレクトされます。
// [START authorize]
router.get(
    // Login url
    '/auth/login',

    //ユーザーの現在のページのURLを保存して、承認後にアプリがリダイレクトできるようにします
    (req, res, next) => {
        if (req.query.return) {
            req.session.oauth2return = req.query.return;
        }
        next();
    },
    // Start OAuth 2 flow using Passport.js
    // passport.authenticate('google', {scope: ['email', 'profile']})
    passport.authenticate('twitter', {scope: ['email', 'profile']})
);
// [END authorize]

//[START callback]
router.get(
    // OAuth 2 callback url. Use this url to configure your OAuth client in the
    // Google Developers console
    '/auth/twitter/callback',

    // Finish OAuth 2 flow using Passport.js
    // passport.authenticate('google'),
    passport.authenticate('twitter'),

    // Redirect back to the original page, if any
    (req, res) => {
        const redirect = req.session.oauth2return || '/';
        delete req.session.oauth2return;
        res.redirect(redirect);
    }
);
//[END callback]

// Deletes the user's credential and profile from the session.
// This does not revoke any active tokens.
router.get('/auth/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = {
    extractProfile: extractProfile,
    router: router,
    required: authRequired,
    template: addTemplateVariables,
};
