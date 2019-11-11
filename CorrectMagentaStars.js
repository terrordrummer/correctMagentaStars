// ****************************************************************************
// PixInsight JavaScript Runtime API - PJSR Version 1.0
// ****************************************************************************
// CorrectMagentaStars.js
// ****************************************************************************
//
// Copyright (C) 2019 Roberto Sartori, Edoarto Luca Radice. All Rights Reserved.
//
// Redistribution and use in both source and binary forms, with or without
// modification, is permitted provided that the following conditions are met:
//
// 1. All redistributions of source code must retain the above copyright
//    notice, this list of conditions and the following disclaimer.
//
// 2. All redistributions in binary form must reproduce the above copyright
//    notice, this list of conditions and the following disclaimer in the
//    documentation and/or other materials provided with the distribution.
//
// 3. Neither the names "PixInsight" and "Pleiades Astrophoto", nor the names
//    of their contributors, may be used to endorse or promote products derived
//    from this software without specific prior written permission. For written
//    permission, please contact info@pixinsight.com.
//
// 4. All products derived from this software, in any form whatsoever, must
//    reproduce the following acknowledgment in the end-user documentation
//    and/or other materials provided with the product:
//
//    "This product is based on software from the PixInsight project, developed
//    by Pleiades Astrophoto and its contributors (http://pixinsight.com/)."
//
//    Alternatively, if that is where third-party acknowledgments normally
//    appear, this acknowledgment must be reproduced in the product itself.
//
// THIS SOFTWARE IS PROVIDED BY PLEIADES ASTROPHOTO AND ITS CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
// TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
// PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL PLEIADES ASTROPHOTO OR ITS
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
// EXEMPLARY OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, BUSINESS
// INTERRUPTION; PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; AND LOSS OF USE,
// DATA OR PROFITS) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
// ****************************************************************************

/* beautify ignore:start */
#define TITLE "CorrectMagentaStars"
#define VERSION "1.1"

#feature-id Utilities > CorrectMagentaStars

#feature-info A magenta stars corrector utility.< br />\
    <br />\
    This script removes the magenta chromatism commonly present at the end of\
    the Hubble Palette composition.\
    <br />\
    Copyright & copy; 2019 Roberto Sartori, Edoardo Luca Radice. All Rights Reserved.

#include <pjsr/ColorSpace.jsh>
#include <pjsr/DataType.jsh>
#include <pjsr/FrameStyle.jsh>
#include <pjsr/NumericControl.jsh>
#include <pjsr/SampleType.jsh>
#include <pjsr/Sizer.jsh>
#include <pjsr/UndoFlag.jsh>
/* beautify ignore:end */



// The script's parameters prototype.
function parametersPrototype()
{
   this.setDefaults = function()
   {
      this.targetView = null;
      this.scnrAmount = 0.8;
   }

   this.setParameters = function()
   {
      Parameters.clear();
      Parameters.set( "scnrAmount", this.scnrAmount );
   }

   this.getParameters = function()
   {
      if ( Parameters.has( "scnrAmount" ) )
      {
         this.scnrAmount = Parameters.getReal( "scnrAmount" );
      }
   }
}
var parameters = new parametersPrototype();
parameters.setDefaults();
parameters.getParameters();

// Returns a push button with given text and onClick function.
function pushButtonWithTextOnClick( parent, text_, onClick_ )
{
   var button = new PushButton( parent );

   button.text = text_;
   button.onClick = onClick_;

   return button;
}

// The script's parameters dialog prototype.
function parametersDialogPrototype()
{
   this.__base__ = Dialog;
   this.__base__();

   var labelMinWidth = Math.round( this.font.width( "Amount:" ) + 2.0 * this.font.width( 'M' ) );

   var sliderMaxValue = 256;
   var sliderMinWidth = 256;

   this.windowTitle = TITLE;

   this.titlePane = new Label( this );

   this.titlePane.frameStyle = FrameStyle_Box;
   this.titlePane.margin = 4;
   this.titlePane.wordWrapping = true;
   this.titlePane.useRichText = true;
   this.titlePane.text =
      "<p><b>" + TITLE + " Version " + VERSION + "</b> &mdash; " +
      "This script reduces the residual magenta chromatism affecting stars that can be present " +
      "after combining Hydrogen-Alpha, Sulphur-II and Oxygen-III channels using the Hubble Palette. " +
      "<p>Copyright &copy; 2012-2015 Roberto Sartori, Edoardo Luca Radice. All Rights Reserved.</p>";

   this.targetView = new HorizontalSizer;

   this.viewList = new ViewList( this );
   this.viewListNullCurrentView = this.viewList.currentView;

   this.viewList.getAll();
   if ( parameters.targetView !== null && parameters.targetView.isView )
   {
      this.viewList.currentView = parameters.targetView;
   }
   else
   {
      parameters.targetView = this.viewList.currentView;
   }
   this.viewList.onViewSelected = function( view )
   {
      parameters.targetView = view;
   }

   this.targetView.add( this.viewList );

   this.parameterPane = new VerticalSizer;

   this.parameterPane.margin = 6;
   this.parameterPane.spacing = 4;

   this.scnrAmountControl = new NumericControl( this );

   this.scnrAmountControl.label.text = "Amount:";
   this.scnrAmountControl.label.minWidth = labelMinWidth;
   this.scnrAmountControl.slider.setRange( 0, sliderMaxValue );
   this.scnrAmountControl.slider.minWidth = sliderMinWidth;
   this.scnrAmountControl.setRange( 0.0, 1.0 );
   this.scnrAmountControl.setPrecision( 2 );
   this.scnrAmountControl.setValue( parameters.scnrAmount );
   this.scnrAmountControl.onValueUpdated = function( value )
   {
      parameters.scnrAmount = value;
   }
   this.scnrAmountControl.toolTip =
      "<p>SCNR amount applied to the inverted image.</p>";

   this.parameterPane.add( this.scnrAmountControl );

   this.buttonPane = new HorizontalSizer;

   this.buttonPane.spacing = 6;

   this.buttonPane.addStretch();
   this.buttonPane.add( pushButtonWithTextOnClick( this, "Execute", function()
   {
      parameters.exit = false;
      this.dialog.ok();
   } ) );
   this.buttonPane.add( pushButtonWithTextOnClick( this, "Close", function()
   {
      parameters.exit = true;
      this.dialog.ok();
   } ) );
   this.bottomBarPane = new HorizontalSizer;

   this.newInstanceButton = new ToolButton( this );
   this.newInstanceButton.icon = new Bitmap( ":/images/interface/dragObject.png" );
   this.newInstanceButton.setScaledFixedSize( 20, 20 );
   this.newInstanceButton.toolTip = "New Instance";
   this.newInstanceButton.onMousePress = function()
   {
      this.hasFocus = true;
      this.pushed = false;
      parameters.setParameters();
      this.dialog.newInstance();
   };

   this.bottomBarPane.add( this.newInstanceButton );
   this.bottomBarPane.add( this.buttonPane );
   this.sizer = new VerticalSizer;

   this.sizer.margin = 6;
   this.sizer.spacing = 6;
   this.sizer.add( this.titlePane );
   this.sizer.add( this.targetView );
   this.sizer.add( this.parameterPane );
   this.sizer.add( this.bottomBarPane );

   this.adjustToContents();
   this.setFixedSize();
}
parametersDialogPrototype.prototype = new Dialog;

// The script's process prototype.
function processPrototype()
{

   this.executeMagentaCorrection = function( targetView )
   {
      var PInvert = new Invert;
      var PSCNR = new SCNR;
      PSCNR.amount = Math.max( 0, Math.min( 1, parameters.scnrAmount ) );
      PSCNR.protectionMethod = SCNR.prototype.AverageNeutral;
      PSCNR.colorToRemove = SCNR.prototype.Green;
      PSCNR.preserveLightness = true;

      var P = new ProcessContainer;

      P.add( PInvert );
      P.add( PSCNR );
      P.add( PInvert );
      P.executeOn( targetView, true );
   }

   this.execute = function()
   {
      this.executeMagentaCorrection( parameters.targetView );
   }
}
var process = new processPrototype();

function colorspaceIsValid( image )
{
   // grayscale is not a valid colorspace for this script
   return !image.isGrayscale
}

function performChecksAndExecute()
{
   console.noteln( "Applying CorrectMagentaStars on target ", ImageWindow.activeWindow.currentView.id );

   if ( !parameters.targetView ||
      !parameters.targetView.image )
   {
      ( new MessageBox(
         "<p>Correct Magenta Stars Error:<br><br>Undefined target view.</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok
      ) ).execute();
      return;
   }
   if ( !colorspaceIsValid( parameters.targetView.image ) )
   {
      ( new MessageBox(
         "<p>Correct Magenta Stars Error:<br><br>Target view color space cannot be Grayscale.</p>",
         TITLE,
         StdIcon_Warning,
         StdButton_Ok
      ) ).execute();
      return;
   }

   process.execute();
}

function executeInGlobalContext()
{
   parameters.targetView = ImageWindow.activeWindow.currentView;
   parameters.getParameters();
   performChecksAndExecute();
}

function executeOnTargetView( view )
{
   parameters.targetView = view;
   parameters.getParameters();
   performChecksAndExecute();
}

function main()
{
   console.hide();

   if ( Parameters.isGlobalTarget )
   {
      // Script has been launched in global context, execute and exit
      executeInGlobalContext();
      return;
   }

   if ( Parameters.isViewTarget )
   {
      // Script has been launched on a view target, execute and exit
      executeOnTargetView( Parameters.targetView );
      return;
   }

   // Prepare the dialog
   var parametersDialog = new parametersDialogPrototype();
   parameters.exit = false;

   // Runloop
   while ( !parameters.exit )
   {

      if ( Parameters.isViewTarget && !parameters.targetView )
      {
         // A target is already defined, init it as the target view
         parameters.targetView = this.targetView;
         parameters.getParameters();
      }
      else
      {
         // Dialog needs to be opened in order to select the image and set parameters
         // Use the current active view as target by default
         parameters.targetView = ImageWindow.activeWindow.currentView;
      }

      // Run the dalog
      var parametersDialog = new parametersDialogPrototype();
      if ( !parametersDialog.execute() )
      {
         // Dialog closure forced
         return;
      }

      // do the job
      if ( !parameters.exit )
      {
         performChecksAndExecute();
      }

      // Workaround to avoid image window close crash in 1.8 RC7.
      parametersDialog.viewList.currentView = parametersDialog.viewListNullCurrentView;
   }
}

main();

// ****************************************************************************
// EOF CorrectMagentaStars.js
