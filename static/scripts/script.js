let conversationContext = '';
let prompt =  `
The IBM Vision Plan (administered by Anthem Blue View Vision) provides comprehensive coverage for you and your dependents, including eye exams and eyewear. You can enroll or review your current vision benefits and monthly costs via NetBenefits.



Alternatively, if you choose not to enroll in the IBM Vision Plan, you may choose to use the EyeMed Discount, at no cost to you or your dependents, which helps you save money on eyewear purchases. No enrollment or ID card is required to access the discounts, you just need to go to a participating provider and ask for the EyeMed Discount.



What do you want to do?

Connect with an expert



I want to understand my vision coverage



Understand the IBM Vision plan and option to use the EyeMed Discount

The IBM Vision Plan is administered by Anthem Blue View Vision

Note: If you choose NOT to enroll in the IBM Vision plan, you may use the EyeMed Discount (no enrollment required). You cannot use both at the same time.

Review my current coverage, monthly costs, dependents at anytime. (See Health & Welfare on NetBenefits)

Find in-network providers for both Anthem Blue View Vision and EyeMed Discount on Anthem.com (Employer ID = IBM) -- See "Find Care" and select "Vision" then enter "Blue View Vision" as the network.

New to IBM or experiencing a qualifying life event? Visit Life Events for more information and guidance on how to model your benefits.



Frequently Asked Questions

Collapse All

How and when will I receive my ID cards?



First-time enrollee: Once you submit your benefits elections via NetBenefits, ID cards will be mailed to you. Please allow up to three weeks from your enrollment date to receive your ID cards in the mail. If you have not received ID cards within this time frame, contact Anthem Blue View Vision. If you have scheduled appointments prior to receipt of your ID card, you can access a digital ID card via the Anthem.com member portal or through the Sydney mobile app. You may also have your provider contact Anthem Blue View Vision directly to confirm coverage.

If existing member (misplaced your ID card): If you would like a new ID card, you will need to call and request it from Anthem Blue View Vision. As a reminder, you can also access your virtual ID card via the Anthem.com member portal or Sydney mobile app.



What is the difference between the IBM Vision Plan and the EyeMed Discount?



The IBM Vision Plan requires a monthly contribution but gives you both in-network and out-of-network coverage for eye exams and eyewear, including annual eye exam, eyeglass frame and lenses or contact lenses. If you enroll in this plan, an ID card will be mailed to you.



You automatically have free access to the EyeMed DiscountPlan (no enrollment is required), which provides in-network discounts (up to 40% on frames, lenses, contact lenses) for eye exams and eyewear. There are no out-of-network benefits and there are no maximums or limits on discounts available.



You can't combine the EyeMed Discount with your IBM Vision Plan.

Do I need an EyeMed Discount card in order to use my discount?



No enrollment or ID card is required to access the discounts.



You will need to go to a participating provider and ask for the EyeMed Discount.

In some cases, the provider may ask for the IBM EyeMed Vision Discount group number, which is: 9245416.

If you prefer to print an ID card, see: 2023 EyeMed Vision Discount for how to print a copy.
`;

let recorder;
let context;

function displayMsgDiv(str, who) {
  const time = new Date();
  let hours = time.getHours();
  let minutes = time.getMinutes();
  const ampm = hours >= 12 ? 'pm' : 'am';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour "0" should be "12"
  hours = hours < 10 ? '0' + hours : hours;
  minutes = minutes < 10 ? '0' + minutes : minutes;
  const strTime = hours + ':' + minutes + ' ' + ampm;
  let msgHtml = "<div class='msg-card-wide mdl-card " + who + "'><div class='mdl-card__supporting-text'>";
  msgHtml += str;
  msgHtml += "</div><div class='" + who + "-line'>" + strTime + '</div></div>';

  $('#messages').append(msgHtml);
  $('#messages').scrollTop($('#messages')[0].scrollHeight);

  if (who == 'user') {
    $('#q').val('');
    $('#q').attr('disabled', 'disabled');
    $('#p2').fadeTo(500, 1);
  } else {
    $('#q').removeAttr('disabled');
    $('#p2').fadeTo(500, 0);
  }
}

$(document).ready(function () {
  $('#q').attr('disabled', 'disabled');
  $('#p2').fadeTo(500, 1);
  $('#h').val('0');

  $.ajax({
    url: '/api/conversation',
    convText: '',
    context: '',
  })
    .done(function (res) {
      conversationContext = res.results.context;
      play(res.results.responseText);
      displayMsgDiv(res.results.responseText, 'bot');
    })
    .fail(function (jqXHR, e) {
      console.log('Error: ' + jqXHR.responseText);
    })
    .catch(function (error) {
      console.log(error);
    });
});

function callConversation(res) {
  $('#q').attr('disabled', 'disabled');

  $.post('/api/flan_conversation', {
    convText: res,
    prompt: prompt, 
    context: conversationContext,
  })
    .done(function (res, status) {
      conversationContext = res.results.context;
      play(res.results.responseText);
      displayMsgDiv(res.results.responseText, 'bot');
    })
    .fail(function (jqXHR, e) {
      console.log('Error: ' + jqXHR.responseText);
    });
}

function play(inputText) {
  let buf;

  const url = '/api/text-to-speech';
  const params = 'text=' + inputText;
  const request = new XMLHttpRequest();
  request.open('POST', url, true);
  request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  request.responseType = 'arraybuffer';

  // Decode asynchronously
  request.onload = function () {
    context.decodeAudioData(
      request.response,
      function (buffer) {
        buf = buffer;
        play();
      },
      function (error) {
        console.error('decodeAudioData error', error);
      }
    );
  };
  request.send(params);

  // Play the loaded file
  function play() {
    // Create a source node from the buffer
    const source = context.createBufferSource();
    source.buffer = buf;
    // Connect to the final output node (the speakers)
    source.connect(context.destination);
    // Play immediately
    source.start(0);
  }
}

const recordMic = document.getElementById('stt2');
recordMic.onclick = function () {
  const fullPath = recordMic.src;
  const filename = fullPath.replace(/^.*[\\/]/, '');
  if (filename == 'mic.gif') {
    try {
      recordMic.src = './static/img/mic_active.png';
      startRecording();
      console.log('recorder started');
      $('#q').val('I am listening ...');
    } catch (ex) {
      // console.log("Recognizer error .....");
    }
  } else {
    stopRecording();
    $('#q').val('');
    recordMic.src = './static/img/mic.gif';
  }
};

function startUserMedia(stream) {
  const input = context.createMediaStreamSource(stream);
  console.log('Media stream created.');
  // Uncomment if you want the audio to feedback directly
  // input.connect(audio_context.destination);
  // console.log('Input connected to audio context destination.');

  // eslint-disable-next-line
  recorder = new Recorder(input);
  console.log('Recorder initialised.');
}

function startRecording(button) {
  recorder && recorder.record();
  console.log('Recording...');
}

function stopRecording(button) {
  recorder && recorder.stop();
  console.log('Stopped recording.');

  recorder &&
    recorder.exportWAV(function (blob) {
      console.log(blob);
      const url = '/api/speech-to-text';
      const request = new XMLHttpRequest();
      request.open('POST', url, true);
      // request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

      // Decode asynchronously
      request.onload = function () {
        callConversation(request.response);
        displayMsgDiv(request.response, 'user');
      };
      request.send(blob);
    });

  recorder.clear();
}

window.onload = function init() {
  try {
    // webkit shim
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia;
    // eslint-disable-next-line
    window.URL = window.URL || window.webkitURL;

    context = new AudioContext();
    console.log('Audio context set up.');
    console.log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
  } catch (e) {
    alert('No web audio support in this browser!');
  }

  navigator.getUserMedia(
    {
      audio: true,
    },
    startUserMedia,
    function (e) {
      console.log('No live audio input: ' + e);
    }
  );
};
