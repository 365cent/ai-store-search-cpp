// used for sending a curl request to the API
// here the OpenAI Whisper model is being run at Replicate
#include "VoiceAPI.h"

// get the file from the path and upload it to the API
// the idea is: get the file path, then send a curl request to the API
// the API will then return a JSON object with the text that contains the transcribed text
// there might be delays for a few seconds, refetching is required
// the text will then be parsed and sent to the frontend as a string
std::string VoiceAPI::callAPI(std::string &filePath)
{
    CURL *curl = curl_easy_init();
    // storing the response from the API
    std::string readBuffer = "";
    std::string url = "https://api.replicate.com/v1/deployments/mdyude/whisper-3307/predictions";
    std::string postFields = "{\"input\": {\"audio\": \"" + filePath + "\"}}";
    std::string token = "{{replace with your own token}}";
    // std::string headers = "Authorization: Token " + token;
    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, ("Authorization: Token " + token).c_str());

    curl_easy_setopt(curl, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, postFields.c_str());
    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curl, CURLOPT_WRITEDATA, &readBuffer);
    curl_easy_setopt(curl, CURLOPT_FORBID_REUSE, 1);
    curl_easy_setopt(curl, CURLOPT_TCP_FASTOPEN, 1L);
    // curl_easy_setopt(curl, CURLOPT_VERBOSE, 1L);


    // execute the CURL command
    CURLcode res = curl_easy_perform(curl);

    if (res != CURLE_OK)
    {
        std::cerr << "curl_easy_perform() failed: " << curl_easy_strerror(res) << std::endl;
    }
    else {
        // cleanup
        curl_slist_free_all(headers);
        curl_easy_cleanup(curl);
        curl = NULL;

        try {   
            auto jsonResponse = nlohmann::json::parse(readBuffer);
            // std::cout << "Response: " << jsonResponse.dump(4) << std::endl;
            return jsonResponse["id"];
        }
        catch (nlohmann::json::parse_error &e)
        {
            std::cerr << "JSON parse error: " << e.what() << std::endl;
        }
    }
    // curl_slist_free_all(headers);
    return "qwertyuiopasdfghjklzxcvbnm";
}


// function for refetching the response
// as it might take a couple seconds to
std::string VoiceAPI::refetch(std::string &id) {
    std::string token = "r8_X1ErZq5FO5J4XZc00HphUvYTWLr3zdP1utzio";
    CURL *curlRe = curl_easy_init();
    std::string readBuffer;
    std::string url = "https://api.replicate.com/v1/predictions/" + id;
    
    struct curl_slist *headers = NULL;
    headers = curl_slist_append(headers, ("Authorization: Token " + token).c_str());
    curl_easy_setopt(curlRe, CURLOPT_URL, url.c_str());
    curl_easy_setopt(curlRe, CURLOPT_HTTPHEADER, headers);
    curl_easy_setopt(curlRe, CURLOPT_WRITEFUNCTION, WriteCallback);
    curl_easy_setopt(curlRe, CURLOPT_WRITEDATA, &readBuffer);
    curl_easy_setopt(curlRe, CURLOPT_FORBID_REUSE, 1);
    curl_easy_setopt(curlRe, CURLOPT_TCP_FASTOPEN, 1L);
    // curl_easy_setopt(curlRe, CURLOPT_VERBOSE, 1L);

    CURLcode res = curl_easy_perform(curlRe);

    if (res != CURLE_OK) {
        std::cerr << "refetech failed: " << curl_easy_strerror(res) << std::endl;
    }
    else {
        try {
            auto jsonResponse = nlohmann::json::parse(readBuffer);
            curl_slist_free_all(headers);
            curl_easy_cleanup(curlRe);
            return jsonResponse.dump();
        }
        catch (nlohmann::json::parse_error &e) {
            std::cerr << "JSON parse error: " << e.what() << std::endl;
        }
    }
    curl_slist_free_all(headers);
    curl_easy_cleanup(curlRe);
    curlRe = NULL;
    return "qwertyuiopasdfghjklzxcvbnm";
}

// callback function for curl
size_t VoiceAPI::WriteCallback(void *contents, size_t size, size_t nmemb, std::string *s)
{
    size_t newLength = size * nmemb;
    try
    {
        s->append((char *)contents, newLength);
        return newLength;
    }
    catch (std::bad_alloc &e)
    {
        // handle memory problem
        return 0;
    }
}

// https://dev-x.hop.cheap/static/upload/57.mp3
// curl -s -X POST \
  -d '{"input": {"audio": "https://dev-x.hop.cheap/static/upload/57.mp3"}}' \
  -H "Authorization: Token " \
  "https://api.replicate.com/v1/deployments/mdyude/whisper-3307/predictions"

// curl -s -H "Authorization: Token r8_X1ErZq5FO5J4XZc00HphUvYTWLr3zdP1utzio" \
//   "https://api.replicate.com/v1/predictions/xewhrijbc33mwg2d2mygecjiku"

