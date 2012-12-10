Changes in the Fork
==================
* Remembers selection state.
* Hides if not a *.js file or if there are no errors to show.

Install via: 

	git clone git://github.com/atishay811/brackets-jshint.git user/jshint

brackets-jshint
=================

A Brackets extension to enable JSHint support. To install, place in your ```brackets/src/extensions/user``` folder.
When installed, you can enable JSHint by clicking 'Enable JSHint' in your View menu.

Currently only the default options are supported. I'm looking for feedback on how to provide ways to customize the options
on each parse.

Issues/Updates
=====
[11/12/2012] Update code to properly insert the content over the status bar. Also made it resizable.  
[9/26/2012] Fix width issue. Thanks to Randy Edmunds for the reports.

Per feedback from Narciso Jaramillo, I use a checkbox to show enabled/disabled status and move to the item when you click a row.

Credit
=====
Built with [JSHint](http://www.jshint.com/) and heavily based on the work of [Jonathan Rowny](http://www.jonathanrowny.com/). 