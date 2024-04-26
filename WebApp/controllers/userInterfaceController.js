const path = require('path');
const languageOptions = require("../jsonData/languageOptionsFrontend");

const renderHomePage = (req , res)=>{

    let conditonsBody = [
       { "title" : "1-Acceptance of the Conditions" , "description" : "By using our site, you agree to comply with these terms and conditions of use. If you do not accept these conditions, please do not use our site." } ,
       { "title" : "2-Collection of Information" , "description" : "We collect personal information for the purpose of providing our services and enhancing your experience. We are committed to protecting your data in accordance with applicable laws. To learn more, please refer to our privacy policy." } ,
       { "title" : "3-Use of Information" , "description" : "We use your personal information for our legitimate business activities. This may include the possibility of sharing aggregated data with partners or third parties for analysis, research, personal use, profit, or marketing purposes." } ,
       { "title" : "4-Consent" , "description" : "By using our site, you consent to the collection, sale, processing, and use of your personal information in accordance with our privacy policy." } ,
       { "title" : "5-Email Privacy" , "description" : "We retain email addresses to keep you informed about updates, potential sales offers, or marketing from us or our partners, special offers, and other relevant information." } ,
       { "title" : "6-Changes to the Conditions" , "description" : "We reserve the right to modify these terms and conditions of use at any time. Changes will take effect upon publication on our site. It is your responsibility to regularly check these terms for updates." } ,
       { "title" : "7-Contact" , "description" : "If you have any questions or concerns regarding these terms and conditions of use, please contact us at filter@sosoon.io." } ,
    ]


    const API_URL = process.env.NODE_ENV =="prod" ? process.env.LIVE_URL : process.env.LOCAL_URL

    res.render("homePage" , {  conditonsBody , languageOptions  , API_URL } )
}


module.exports = { 
    renderHomePage,
}