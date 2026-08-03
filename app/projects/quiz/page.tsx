import { genPageMetadata } from '@/app/seo'
import Quiz from './Quiz'

export const metadata = genPageMetadata({
  title: 'What Will Your Job Be Once The Revolution Happens?',
})

const SHARE_URL = 'https://jackyoustra.com/projects/quiz'

export default function Projects() {
  return (
    <>
      <h2 className="text-center text-2xl font-bold italic">
        I can&apos;t find the neoliberal project&apos;s buzzfeed quiz anymore, so I made my own copy of it.
        Enjoy!
      </h2>
      <hr />
      <Quiz
        title="What Will Your Job Be Once The Revolution Happens?"
        description="Once we've overthrown capitalism and instituted socialism, wonder what you'll be able to contribute to the community? Wonder what the future will hold for you, finally free from the shackles of global capital and the 1%? Take this quiz to find out!"
        byline={{
          author: 'neoliberalproject',
          authorLink:
            'https://web.archive.org/web/20201229055816/https://www.buzzfeed.com/neoliberalproject',
          authorLinkOpenInNewTab: true,
          tagline: 'Community Contributor',
          avatarImageSrc:
            'https://img.buzzfeed.com/buzzfeed-static/static/avatars/beagle_large.jpg?resize=100:100&quality=auto',
        }}
        shareUrl={SHARE_URL}
        copyShareText={`Find out what your job will be once the revolution happens at ${SHARE_URL}.`}
        questions={[
          {
            question: "In your free time, what's your favorite hobby?",
            backgroundColor: 'red',
            answers: [
              'Playing music, telling stories',
              'Working with my hands',
              'Reading, discussing, debating ideas',
              'Wandering the Great Outdoors',
            ],
          },
          {
            question: 'What was your favorite subject in school?',
            backgroundColor: 'blue',
            answers: ['Math', 'Science', 'Literature', 'History'],
          },
          {
            question: 'How would you describe your personality?',
            backgroundColor: 'black',
            answers: [
              'Inquisitive, skeptical',
              'Caring, compassionate',
              'Tough, strong',
              'Funny, life of the party',
            ],
          },
          {
            question: 'What kind of workplace suits you best?',
            backgroundColor: 'purple',
            answers: [
              'Working on my own',
              'Working with small teams',
              'Working in very large organizations',
              "Work? I'm more of a free spirit!",
            ],
          },
          {
            question: 'What is your dream accomplishment?',
            // White on `pink` is unreadable (1.4:1); the rest of the palette is fine.
            backgroundColor: 'pink',
            fontColor: '#111827',
            answers: [
              'To help as many people as I can',
              'To discover new things about the world around us',
              'To build something that will stand the test of time',
              'To connect with others, and grow as a person',
            ],
          },
        ]}
        // One result, always. Every answer led here in the original too — that's the bit.
        result={{
          title: 'Forced Agricultural Laborer',
          description:
            'Rejoice, comrade! The Central Committee has determined your ideal new job in our socialist utopia - collective farm labor. Your comrades in the army will be along shortly to escort you and your family to a new, socialist home.',
          imageSrc:
            'https://www.encyclopediaofukraine.com/pic%5CC%5CO%5CCollective%20farm%20propaganda%20poster.jpg',
          imageAttribution: 'Collective farm propaganda poster, via the Encyclopedia of Ukraine',
        }}
      />
    </>
  )
}
