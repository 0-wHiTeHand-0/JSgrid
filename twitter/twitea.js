exports.twitea = function(eltweet) {

var keys = require('./claves');

var util = require('util');
var twitter = require('twitter');

var tweet = new twitter({
    consumer_key: keys.consumerKey,
    consumer_secret: keys.ConsumerSecret,
    access_token_key: keys.tokenKey,
    access_token_secret: keys.tokenSecret
});

tweet.updateStatus(eltweet,
        function(data) {
            console.log(util.inspect(data));
        }
    );
}