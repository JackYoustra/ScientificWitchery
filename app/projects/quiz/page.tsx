'use client'

import { BuzzFeedQuiz } from 'react-buzzfeed-quiz'
import BackgroundImage from '/public/static/images/nanoflick.webp'
import FirstResultImage from '/public/static/images/nanoflick.webp'
import SecondResultImage from '/public/static/images/nanoflick.webp'
import ResponseImage from '/public/static/images/nanoflick.webp'
import 'react-buzzfeed-quiz/lib/styles.css'
import './customstyles.css'

export default function Projects() {
  return (
    <>
      <h2 className="text-center text-2xl font-bold italic">
        I can't find the neoliberal project's buzzfeed quiz anymore, so I made my own copy of it.
        Enjoy!
      </h2>
      <hr />
      <BuzzFeedQuiz
        title={'What Will Your Job Be Once The Revolution Happens?'}
        description={
          "Once we've overthrown capitalism and instituted socialism, wonder what you'll be able to contribute to the community? Wonder what the future will hold for you, finally free from the shackles of global capital and the 1%? Take this quiz to find out!"
        }
        byline={true}
        bylineAuthor={'neoliberalproject'}
        bylineAuthorLink={
          'https://web.archive.org/web/20201229055816/https://www.buzzfeed.com/neoliberalproject'
        }
        bylineAuthorLinkOpenInNewTab={true}
        bylineAuthorTagline={'Community Contributor'}
        bylineAvatarImageSrc={
          'https://img.buzzfeed.com/buzzfeed-static/static/avatars/beagle_large.jpg?resize=100:100&quality=auto'
        }
        autoScroll={true}
        facebookShareButton={true}
        facebookShareLink={'www.jackyoustra.com/projects/quiz'}
        twitterShareButton={true}
        twitterShareLink={'www.jackyoustra.com/projects/quiz'}
        copyShareButton={true}
        copyShareLink={
          'Find out what your job will be once the revolution happens at www.jackyoustra.com/projects/quiz.'
        }
        questions={[
          {
            question: "In your free time, what's your favorite hobby?",
            backgroundColor: 'red',
            answers: [
              'Playing music, telling stories',
              'Working with my hands',
              'Reading, discussing, debating ideas',
              'Wandering the Great Outdoors',
            ].map((answer, index) => ({
              answer,
              backgroundColor: 'red',
              resultID: 0,
            })),
          },
          {
            question: 'What was your favorite subject in school?',
            backgroundColor: 'blue',
            answers: ['Math', 'Science', 'Literature', 'History'].map((answer, index) => ({
              answer,
              backgroundColor: 'blue',
              resultID: 0,
            })),
          },
          {
            question: 'How would you describe your personality?',
            backgroundColor: 'black',
            answers: [
              'Inquisitive, skeptical',
              'Caring, compassionate',
              'Tough, strong',
              'Funny, life of the party',
            ].map((answer, index) => ({
              answer,
              backgroundColor: 'black',
              resultID: 0,
            })),
          },
          {
            question: 'What kind of workplace suits you best?',
            backgroundColor: 'purple',
            answers: [
              'Working on my own',
              'Working with small teams',
              'Working in very large organizations',
              "Work? I'm more of a free spirit!",
            ].map((answer, index) => ({
              answer,
              resultID: 0,
              backgroundColor: 'purple',
            })),
          },
          {
            question: 'What is your dream accomplishment?',
            backgroundColor: 'pink',
            answers: [
              'To help as many people as I can',
              'To discover new things about the world around us',
              'To build something that will stand the test of time',
              'To connect with others, and grow as a person',
            ].map((answer, index) => ({
              answer,
              backgroundColor: 'pink',
              resultID: 0,
            })),
          },
        ]}
        results={[
          {
            title: 'Forced Agricultural Laborer',
            description:
              'Rejoice, comrade! The Central Committee has determined your ideal new job in our socialist utopia - collective farm labor. Your comrades in the army will be along shortly to escort you and your family to a new, socialist home.',
            resultImageSrc:
              'https://www.encyclopediaofukraine.com/pic%5CC%5CO%5CCollective%20farm%20propaganda%20poster.jpg',
            imageAttribution: 'Your photo attribution text goes here',
            resultID: 0,
          },
        ]}
      />
    </>
  )
}
