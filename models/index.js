console.log('Entering models/index.js...');
var models = [
'contact',
'user',
'organization'
];
for (var i=0;i<models.length;i++) {
    console.log('requiring '+models[i]);
    require('./'+models[i]+'.js');
}
