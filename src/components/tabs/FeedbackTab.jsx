import { useState } from "react";
import { MessageSquare, Send, ThumbsUp, AlertCircle } from "lucide-react";

export default function FeedbackTab() {
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setMessage("");
    }, 600);
  };

  return (
    <div className="flex flex-1 overflow-hidden bg-[#f5f6f8] p-6 justify-center">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        
        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">System Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">
            Submit your feedback, bug reports, or feature suggestions directly to the SwachhOS development team.
          </p>
        </div>

        {/* Feedback Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {submitted ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <ThumbsUp className="text-green-500" size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Feedback Submitted!</h3>
              <p className="text-sm text-gray-500 mt-2 max-w-sm">
                Thank you for helping us improve SwachhOS. Our team will review your submission shortly.
              </p>
              <button 
                onClick={() => setSubmitted(false)}
                className="mt-6 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
              >
                Submit another response
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              {/* Type Selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-3 uppercase tracking-wider">Feedback Type</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFeedbackType("suggestion")}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                      feedbackType === "suggestion" 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600" 
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <MessageSquare size={20} />
                    <span className="text-xs font-bold">Suggestion</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType("bug")}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                      feedbackType === "bug" 
                        ? "border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600" 
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <AlertCircle size={20} />
                    <span className="text-xs font-bold">Bug Report</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType("compliment")}
                    className={`p-3 border rounded-xl flex flex-col items-center gap-2 transition-all ${
                      feedbackType === "compliment" 
                        ? "border-green-600 bg-green-50 text-green-700 ring-1 ring-green-600" 
                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <ThumbsUp size={20} />
                    <span className="text-xs font-bold">Compliment</span>
                  </button>
                </div>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">Your Message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tell us what's on your mind..."
                  className="w-full h-32 border border-gray-300 rounded-xl p-4 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none transition-shadow"
                ></textarea>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!message.trim()}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Send Feedback</span>
                  <Send size={16} />
                </button>
              </div>

            </form>
          )}
        </div>

      </div>
    </div>
  );
}
