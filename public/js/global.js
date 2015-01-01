// Simple card buttons
$('.card').click(function(e) {

  // Modal function
  if($(e.target).is('.open-modal')) {
    var data = $(e.target).attr('data');
    $(data).show();
    return false;
  } else if($(e.target).parent().is('.open-modal')) {
    var data = $(e.target).parent().attr('data');
    $(data).show();
    return false;
  }

  if($(this).hasClass('on')) {
    $(this).find('.on-append').remove();
    $(this).find('.upcoming-event').show();
    $(this).find('.additional-info').show();
    $(this).removeClass('on');
  } else {
    $(this).append('<div class=\'on-append\'>' +
    '<a href=\'/candidate\'><i class=\'oi\' data-glyph=\'person\'></i></a>' +
    // '<span class=\'open-modal\' data=\'.contact-modal\'><i class=\'oi\' data-glyph=\'phone\'></i></span>' +
    '<span class=\'open-modal\' data=\'.schedule-modal\'><i class=\'oi\' data-glyph=\'calendar\'></i></span>' +
    '<span class=\'open-modal\' data=\'.advance-modal\'><i class=\'oi\' data-glyph=\'arrow-thick-right\'></i></span>' +
    '<span class=\'open-modal\' data=\'.delete-modal\'><i class=\'oi\' data-glyph=\'x\'></i></span>' +
    '</div>');
    $(this).find('.upcoming-event').hide();
    $(this).find('.additional-info').hide();
    $(this).addClass('on');
  }
});

$('.open-modal').click(function() {
  var data = $(this).attr('data');
  $(data).show();
});

$('.modal-actions button').click(function() {
  $(this).parent().parent().hide();
});

$('.candidate-actions button').click(function() {
  $(this).parent().parent().parent().hide();
});


// Top header tab highlighting
$(document).ready(function () {
  var path = window.location.pathname;
  if(path == '/today/interviewer' || path == '/today/hr') {
    $('.tab_2').addClass('tab-on');
  } else if(path == '/') {
    $('.tab_1').addClass('tab-on');
  } else if(path == '/activity') {
    $('.tab_3').addClass('tab-on');
  }
})

$('.content-header .tab-a').click(function (e) {
  $('.view-a').show();
  $('.view-b').hide();

  $('.tab-b').removeClass('tab-on');
  $('.tab-a b').show();
  $('.tab-a').addClass('tab-on');
});

$('.content-header .tab-b').click(function (e) {
  $('.view-b').show();
  $('.view-a').hide();

  $('.tab-a').removeClass('tab-on');
  $('.tab-a b').hide();
  $('.tab-b').addClass('tab-on');
});
