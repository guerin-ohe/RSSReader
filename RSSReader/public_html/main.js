/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

//used for caching
var feedCache = {};

// on IntroPage show
var onIntroPageShow = function(e) {
    displayFeeds();
}

// on AddFeedForm submit
var onAddFeedFormSubmit = function(e) {
    handleAddFeed();
    return false;
}

// on AddFeedPage show
var onAddFeedPageShow = function(e) {
    $("#addFeedForm").submit(onAddFeedFormSubmit);
}

// on FeedPage show
var onFeedPageShow = function(e) {
    //get the feed id based on query string
    var query = $(this).data("url").split("=")[1];
    //remove ?id=
    query = query.replace("?id=", "");
    //assume it's a valid ID, since this is a mobile app folks won't be messing with the urls, but keep
    //in mind normally this would be a concern
    var feeds = getFeeds();
    var thisFeed = feeds[query];
    $("h1", this).text(thisFeed.name);
    if (!feedCache[thisFeed.url]) {
        $("#feedcontents").html("<p>Fetching data...</p>");
        
        //now use Google Feeds API
        var feedServiceUrl = "https://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&q=" + encodeURI(thisFeed.url) + "&callback=?";
        
        // on feed service return
        var onFeedServiceReturn = function (res, code) {
            //see if the response was good...
            if (res.responseStatus == 200) {
                feedCache[thisFeed.url] = res.responseData.feed.entries;
                displayFeed(thisFeed.url);
            } else {
                var error = "<p>Sorry, but this feed could not be loaded: < /p><p>" + res.responseDetails + "</p >";
                $("#feedcontents").html(error);
            }
        }
        
        $.get(feedServiceUrl, {}, onFeedServiceReturn, "json");
    } else {
        displayFeed(thisFeed.url);
    }
}

// on entry page show
var onEntryPageShow = function(e) {
    //debug
    //console.log($(this).data("url"));
    
    //get the entry id and url based on query string
    var request = $(this).data("url");
    var entryid = request.match(/entry=([^&]+)/)[1];
    var url = request.match(/url=([^&]+)/)[1];
    var entry = feedCache[url][entryid];
    $("h1", this).text(entry.title);
    $("#entrycontents", this).html(entry.content);
    $("#entrylink", this).attr("href", entry.link);
}

// on del feed page show
var onDelFeedConfPageShow = function(e) {
    //get the entry id and url based on query string
    var request = $(this).data("url");
    var feedid = request.match(/feedid=([^&]+)/)[1];
    var feeds = getFeeds();
    $("#delfeedmsg", this).html("Are you sure to delete feed : " + feeds[feedid].name + " ?");
    //$("#delfeedok", this).attr("href", "index.html?feedid='" + feedid + "'");
}

// app init
var init = function() {
    //handle getting and displaying the intro or feeds
    $(document).on("pageshow", "#intropage", onIntroPageShow);
    
    //Listen for the addFeed Page so we can support adding feeds
    $(document).on("pageshow", "#addfeedpage", onAddFeedPageShow);
    
    //Listen for the Feed Page so we can displaying entries
    $(document).on("pageshow", "#feedpage", onFeedPageShow);
    
    //Listen for the Entry Page 
    $(document).on("pageshow", "#entrypage", onEntryPageShow);
}

// display feeds
function displayFeeds() {
    var feeds = getFeeds();
    if (feeds.length == 0) {
        //in case we had one form before...
        $("#feedList").html("");
        $("#introContentNoFeeds").show();
    } else {
        $("#introContentNoFeeds").hide();
        var s = "";
        for (var i = 0; i < feeds.length; i++) {
            s += "<li data-icon='delete'><a href='feed.html?id=" + i + "' datafeed='" + i + "'>" + feeds[i].name + "</a><a href='#' onclick='handleDelFeed(" + i + ")' feedid='" + i + "'>Delete</a></li>";
        }
        $("#feedList").html(s);
        $("#feedList").listview("refresh");
    }
}

// display an feed
function displayFeed(url) {
    var entries = feedCache[url];
    var s = "<ul data-role='listview' data-inset='true' id='entrylist'>";
    for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        s += "<li><a href='entry.html?entry=" + i + "&url=" + encodeURI(url) + "'>" + entry.title + "</a></li>";
    }
    s += "</ul>";
    $("#feedcontents").html(s);
    $("#entrylist").listview();
}

//
// manage feeds
//
//
// get feeds list
function getFeeds() {
    if (localStorage["feeds"]) {
        return JSON.parse(localStorage["feeds"]);
    } else
        return [];
}

// add new feed
function addFeed(name, url) {
    var feeds = getFeeds();
    feeds.push({name: name, url: url});
    localStorage["feeds"] = JSON.stringify(feeds);
}

// delete feed by id
function removeFeed(id) {
    var feeds = getFeeds();
    feeds.splice(id, 1);
    localStorage["feeds"] = JSON.stringify(feeds);
    displayFeeds();
}

// handle add feed
function handleAddFeed() {
    
    var feedname = $.trim($("#feedname").val());
    var feedurl = $.trim($("#feedurl").val());
    
    // basic error handling
    var errors = "";
    if (feedname == "")
        errors += "Feed name is required.\n";
    if (feedurl == "")
        errors += "Feed url is required.\n";
    if (errors != "") {
        //Create a PhoneGap notification for the error
        navigator.notification.alert(errors, function () {});
    } else {
        addFeed(feedname, feedurl);
        $.mobile.changePage("index.html");
    }
}

var handleDelFeed = function (feedid)
{
    removeFeed(feedid);
}
