i-am-here-weirdmeetup
=====================

I am here 이상한 모임 좌표 알림 서비스

* http://iamhere.weirdmeetup.com
* 이상한 모임이란? http://weirdmeetup.com
* 이상한모임 팀블로그 http://we.weirdmeetup.com

Installation
------------

`nodejs`, `meteor` and `meteorite` are required.

  * [nodejs](http://nodejs.org/)
  * [meteor](https://www.meteor.com/)
  * [meteorite](https://github.com/oortcloud/meteorite/)

Download and install `nodejs` from [website](http://nodejs.org/). And then install `meteor`.

    $ curl https://install.meteor.com/ | sh

Clone repository from github and change to cloned directory.

    $ git clone https://github.com/weirdmeetup/i-am-here-weirdmeetup.git && cd i-am-here-weirdmeetup

Install `meteorite` and update related packages.
    
    $ npm install -g meteorite
    $ mrt update

Now you can run the code with local or deploy to meteor server.

    $ meteor
    or
    $ meteor deploy YOUR_METEOR_ADDRESS.meteor.com
