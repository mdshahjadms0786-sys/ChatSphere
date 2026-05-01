const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: ['profile', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const googleId = profile.id;
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const avatar = profile.photos[0].value;

        let user = await User.findOne({ googleId });

        if (user) {
          return done(null, user);
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
          emailExists.googleId = googleId;
          emailExists.avatar = avatar;
          await emailExists.save();
          return done(null, emailExists);
        }

        const newUser = await User.create({
          name,
          email,
          googleId,
          avatar,
          isVerified: true,
          password: crypto.randomBytes(32).toString('hex'),
        });

        return done(null, newUser);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;