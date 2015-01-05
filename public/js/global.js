// Simple card buttons
$('.card').click(function(e) {

  // Modal function
  if($(e.target).is('.open-modal')) {
    var data = $(e.target).attr('data');
    $(data).show();
    $('.overlay').show();
    return false;
  } else if($(e.target).parent().is('.open-modal')) {
    var data = $(e.target).parent().attr('data');
    $(data).show();
    $('.overlay').show();
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
  $('.overlay').show();
});

$('.modal-actions button').click(function() {
  $(this).parent().parent().hide();
  $('.overlay').hide();
});

$('.candidate-actions button').click(function() {
  $(this).parent().parent().parent().hide();
  $('.overlay').hide();
});

$('.overlay').click(function() {
  $('.modal').hide();
  $(this).hide();
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
  } else if(path =='/candidates') {
    $('.tab_4').addClass('tab-on');
  }
})

$('.left-tab').click(function (e) {
  $('.content-tasks').hide();
  $('.left-sub-tabs').hide();
  var data = $(this).attr('data');
  $(data).show();

  $('.left-tab').removeClass('tab-on');
  $(this).addClass('tab-on');
});

// Column process filter dropdown
$('.column-header-filter').click(function() {
  $(this).parent().find('.column-dropdown').show();
});

$('.column-dropdown').click(function() {
  $(this).hide();
});

// Header filter dropdown
$('.header-filter').click(function(e) {
  if($(e.target).parent().is('.header-dropdown')) {
    $(e.target).parent().hide();
  } else {
    $(this).find('.header-dropdown').show();
  }
});

$('.logo').click(function() {
  introJs().start();
});
